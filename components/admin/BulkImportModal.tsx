
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, FileType } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { parseChordsFromText } from '../../lib/musicUtils';
import { cn } from '../../lib/utils';

// FIX: Dynamically resolve worker version to match installed API version
const pdfjsVersion = pdfjsLib.version || '4.0.379';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlbumRow {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
}

interface ProcessedFile {
  id: string;
  fileName: string;
  status: 'pending' | 'parsing' | 'clustering' | 'saving' | 'done' | 'error';
  detectedTitle?: string;
  detectedArtist?: string;
  albumAction?: 'created' | 'linked' | 'none';
  errorMsg?: string;
}

// --- CONSTANTS & REGEX ---
const META_FILTER_REGEX = /^(difficulty|tuning|capo|tabbed by|strumming|bpm|page|author|key|time sig|date)/i;
const TAB_LINE_REGEX = /^[-0-9|hpx\/\\]{5,}$/; 
// Enhanced Regex: Supports A+, Aaug, A(add9), (A), etc.
const CHORD_STRICT_REGEX = /\b[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?(?:\([^\)]+\))?\b/g;

// --- HELPER: DETECT CHORD LINE ---
const isChordLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // 1. Fail if obvious lyric words exist
    if (/\b(the|and|you|that|was|for|are|with|his|they|this|sent|heart|love|when|what)\b/i.test(trimmed)) return false;

    // 2. Density Check
    const tokens = trimmed.split(/\s+/);
    let chordCount = 0;
    
    tokens.forEach(t => {
        // Strip parentheses/brackets for check
        const cleanT = t.replace(/[\(\)\[\]]/g, '');
        if (cleanT.match(/^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?$/)) {
            chordCount++;
        }
    });

    // Threshold: > 60% valid chords (lowered to catch sparse chord lines)
    return (chordCount / tokens.length) > 0.6;
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
        setResults(prev => [...prev, ...droppedFiles.map(f => ({ 
            id: Math.random().toString(36).substr(2, 9), 
            fileName: f.name, 
            status: 'pending' 
        } as ProcessedFile))]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const selected = Array.from(e.target.files).filter((f: File) => f.type === 'application/pdf');
          setFiles(prev => [...prev, ...selected]);
          setResults(prev => [...prev, ...selected.map(f => ({ 
                id: Math.random().toString(36).substr(2, 9), 
                fileName: f.name, 
                status: 'pending' 
            } as ProcessedFile))]);
      }
  };

  // --- ADVANCED TEXT EXTRACTION WITH SPATIAL CLUSTERING ---
  const extractTextWithLayout = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullOutput = '';
      const maxPages = Math.min(pdf.numPages, 5);
      
      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 }); // Use 1.0 to normalize units

          // 1. Normalize Items
          const items = textContent.items.map((item: any) => ({
              str: item.str,
              x: item.transform[4],
              // Invert Y because PDF origin is bottom-left, we want top-left reading order
              y: viewport.height - item.transform[5], 
              width: item.width,
              height: item.height || 10 // Fallback height
          })).filter(item => item.str.trim().length > 0);

          // 2. Sort mainly by Y, then X
          items.sort((a, b) => {
              if (Math.abs(a.y - b.y) < 2) return a.x - b.x; // Same visual line
              return a.y - b.y;
          });

          // 3. Group into Lines (Row Clustering)
          // We use a 'tolerance' because characters in the same line might have slightly different Y values
          const rows: { y: number, items: typeof items }[] = [];
          const Y_TOLERANCE = 4; // Pixels tolerance for same line

          items.forEach(item => {
              // Find an existing row that is close enough vertically
              const row = rows.find(r => Math.abs(r.y - item.y) <= Y_TOLERANCE);
              if (row) {
                  row.items.push(item);
              } else {
                  rows.push({ y: item.y, items: [item] });
              }
          });

          // 4. Construct Strings from Rows
          const pageLines = rows.map(row => {
              // Sort items strictly by X within the row
              row.items.sort((a, b) => a.x - b.x);

              let lineText = "";
              let currentX = 0; // Start of page

              row.items.forEach(item => {
                  // Determine spacing based on gap from previous item
                  // Heuristic: 4px is roughly a space char width in standard 12pt font
                  const gap = item.x - currentX;
                  
                  // If this is not the first item and there's a gap, add spaces
                  if (currentX > 0 && gap > 2) {
                      const spaces = Math.floor(gap / 3.5); // 3.5px per space approx
                      lineText += " ".repeat(Math.max(1, Math.min(spaces, 20)));
                  }
                  
                  lineText += item.str;
                  currentX = item.x + (item.width || (item.str.length * 4)); // Estimate end X
              });
              return lineText;
          });

          fullOutput += pageLines.join('\n') + '\n';
      }
      return fullOutput;
  };

  const cleanAndMergeChords = (rawText: string): string => {
      let lines = rawText.split('\n');
      const processedLines: string[] = [];

      // 1. Filter Metadata
      lines = lines.filter(line => {
          const clean = line.trim();
          if (!clean) return false;
          if (META_FILTER_REGEX.test(clean)) return false;
          if (TAB_LINE_REGEX.test(clean.replace(/\s/g, ''))) return false; 
          if (/^\d+\s*\/\s*\d+$/.test(clean)) return false; // Page numbers
          return true;
      });

      // 2. Merge Logic
      for (let i = 0; i < lines.length; i++) {
          const currentLine = lines[i];
          const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

          // If it's a chord line...
          if (isChordLine(currentLine)) {
              // Check if next line is Lyrics (NOT a chord line, NOT empty)
              if (nextLine && !isChordLine(nextLine)) {
                  
                  // Merge Strategy: Insert chords into the lyric line
                  // Since we reconstructed spatial layout, spaces in `currentLine` roughly align with `nextLine`
                  
                  let mergedLine = "";
                  const chordMatches = [...currentLine.matchAll(CHORD_STRICT_REGEX)];
                  
                  let lastLyricIndex = 0;
                  
                  // If there are no lyrics below (it's empty or just metadata), treat as pure chord line
                  // But we checked `!isChordLine(nextLine)`, so it is likely lyrics or section header
                  
                  // EDGE CASE: Header detected in "lyrics" slot (e.g. [Chorus])
                  // Don't merge chords onto a header line.
                  if (/^\[.+\]$/.test(nextLine.trim())) {
                      processedLines.push(currentLine.replace(CHORD_STRICT_REGEX, '[$&]')); // Wrap chords
                      continue; // Don't skip next line, let the next iteration handle the header
                  }

                  // Normal Merge
                  let bufferLine = nextLine;
                  
                  // We iterate chords from Right to Left to insert without messing up indices? 
                  // Actually, inserting [Chord] changes string length, so Right-to-Left is safer OR rebuild string
                  // Let's rebuild string from chunks.
                  
                  // Better strategy for alignment:
                  // We need to convert the 'visual index' of the chord in Line A to an insertion point in Line B.
                  // Since we assume monospaced alignment roughly:
                  
                  let resultLine = "";
                  let currentIdx = 0; // Index in the Lyric Line
                  
                  chordMatches.forEach(match => {
                      const chordStr = match[0];
                      const visualIndex = match.index!;
                      
                      // Append lyrics up to this visual index
                      if (visualIndex > currentIdx) {
                          // If the lyric line is shorter than the chord position, pad it
                          if (currentIdx >= bufferLine.length) {
                              resultLine += " ".repeat(visualIndex - currentIdx);
                          } else {
                              resultLine += bufferLine.slice(currentIdx, visualIndex);
                          }
                      }
                      
                      // Insert Chord
                      resultLine += `[${chordStr}]`;
                      currentIdx = visualIndex;
                  });
                  
                  // Append remaining lyrics
                  if (currentIdx < bufferLine.length) {
                      resultLine += bufferLine.slice(currentIdx);
                  }
                  
                  processedLines.push(resultLine);
                  i++; // Consumed next line
              } 
              else {
                  // Chord Line followed by another Chord Line (Intro, etc) OR End of file
                  // Wrap each chord in brackets to preserve them
                  processedLines.push(currentLine.replace(CHORD_STRICT_REGEX, '[$&]'));
              }
          } 
          else {
              // Just text/lyrics/header
              const trimmed = currentLine.trim();
              // Header detection
              if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro|Instrumental).*:/i.test(trimmed)) {
                  const headerName = trimmed.replace(/[:\[\]]/g, '').trim();
                  processedLines.push(`{comment: ${headerName}}`);
              } else {
                  processedLines.push(currentLine);
              }
          }
      }

      return processedLines.join('\n')
          .replace(/\[([A-G][#b]?)\/\]/g, '[$1]') 
          .replace(/\s{2,}/g, ' ');
  };

  const parseMetadata = (text: string, fileName: string) => {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let title = fileName.replace(/\.pdf$/i, '');
      let artist = 'Unknown Artist';
      
      // Heuristic: Look for "Song by Artist"
      const byLine = lines.find(l => /\bby\b/i.test(l) && l.length < 50);
      if (byLine) {
          const parts = byLine.split(/\bby\b/i);
          if (parts.length > 1) {
              artist = parts[1].trim();
              // Try to find title above
              const idx = lines.indexOf(byLine);
              if (idx > 0 && lines[idx-1].length < 50) title = lines[idx-1];
          }
      }
      
      // Fallback: Clean filename
      if (title === fileName.replace(/\.pdf$/i, '')) {
          // If filename is "Artist - Song"
          if (title.includes('-')) {
              const parts = title.split('-');
              artist = parts[0].trim();
              title = parts[1].trim();
          }
      }
      
      return { title, artist };
  };

  const ensureAlbum = async (artistName: string): Promise<{ id: string, action: 'created' | 'linked' | 'none' }> => {
      if (!artistName || artistName === 'Unknown Artist') return { id: '', action: 'none' };
      const normalized = artistName.toLowerCase().trim();
      
      const { data: existingData } = await supabase
        .from('albums').select('id').ilike('artist', normalized).limit(1);

      if (existingData && existingData.length > 0) {
          const existingAlbum = existingData[0] as unknown as AlbumRow;
          return { id: existingAlbum.id, action: 'linked' };
      }

      const { data: newAlbumData, error } = await supabase
        .from('albums')
        .insert([{
            title: `${artistName} Collection`,
            artist: artistName,
            cover_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=random&size=512`
        }])
        .select().single();

      if (error || !newAlbumData) return { id: '', action: 'none' };
      return { id: (newAlbumData as any).id, action: 'created' };
  };

  const processBatch = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (results[i].status === 'done') continue;

          const updateStatus = (s: Partial<ProcessedFile>) => {
              setResults(prev => {
                  const next = [...prev];
                  next[i] = { ...next[i], ...s };
                  return next;
              });
          };

          try {
              updateStatus({ status: 'parsing' });
              const rawTextWithLayout = await extractTextWithLayout(file);
              const { title, artist } = parseMetadata(rawTextWithLayout, file.name);
              updateStatus({ detectedTitle: title, detectedArtist: artist });

              const finalChordPro = cleanAndMergeChords(rawTextWithLayout);
              const parsedChords = parseChordsFromText(finalChordPro);

              updateStatus({ status: 'clustering' });
              const { id: albumId, action } = await ensureAlbum(artist);
              
              updateStatus({ status: 'saving', albumAction: action });
              const { error } = await supabase.from('songs').insert([{
                  title,
                  artist,
                  difficulty: 'Medium', 
                  album_id: albumId || null,
                  chords: parsedChords,
                  view_count: 0
              }]);

              if (error) throw error;
              updateStatus({ status: 'done' });

          } catch (err: any) {
              console.error(err);
              updateStatus({ status: 'error', errorMsg: err.message });
          }
      }
      setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileType className="w-5 h-5 text-primary" /> Smart PDF Importer
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Spatial analysis engine for perfect chord alignment.</p>
                    </div>
                    <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Dropzone */}
                <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                        "p-8 border-2 border-dashed transition-all m-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer",
                        isDragActive 
                            ? "border-primary bg-primary/10" 
                            : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-slate-50 dark:bg-black/20"
                    )}
                >
                    <input type="file" multiple accept=".pdf" onChange={handleFileInput} className="hidden" id="bulk-file-input" />
                    <label htmlFor="bulk-file-input" className="cursor-pointer flex flex-col items-center w-full h-full">
                        <Upload className={cn("w-10 h-10 mb-3 transition-colors", isDragActive ? "text-primary" : "text-slate-400")} />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {isDragActive ? "Drop PDF files now" : "Click to upload or drag PDFs here"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Supported: Standard Chord Sheets (Text-based PDFs)</p>
                    </label>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar min-h-[200px]">
                    <div className="space-y-2">
                        {results.length === 0 && (
                            <div className="text-center py-10 text-slate-400 italic text-sm">
                                Queue is empty.
                            </div>
                        )}
                        {results.map((file) => (
                            <div key={file.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10">
                                    <FileText className="w-4 h-4 text-red-500" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.fileName}</p>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                            file.status === 'pending' && "bg-slate-200 text-slate-600",
                                            file.status === 'parsing' && "bg-blue-100 text-blue-600",
                                            file.status === 'clustering' && "bg-purple-100 text-purple-600",
                                            file.status === 'saving' && "bg-yellow-100 text-yellow-600",
                                            file.status === 'done' && "bg-green-100 text-green-600",
                                            file.status === 'error' && "bg-red-100 text-red-600"
                                        )}>
                                            {file.status}
                                        </span>
                                    </div>
                                    
                                    {file.detectedTitle && (
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Music className="w-3 h-3" /> {file.detectedTitle}</span>
                                            <span className="flex items-center gap-1"><Disc3 className="w-3 h-3" /> {file.detectedArtist}</span>
                                            {file.albumAction === 'created' && <span className="text-green-500 font-bold flex items-center gap-1 text-[9px] border border-green-500/20 px-1 rounded">NEW ALBUM</span>}
                                            {file.albumAction === 'linked' && <span className="text-blue-500 font-bold flex items-center gap-1 text-[9px] border border-blue-500/20 px-1 rounded">LINKED</span>}
                                        </div>
                                    )}
                                    
                                    {file.errorMsg && <p className="text-xs text-red-500 mt-1">{file.errorMsg}</p>}
                                </div>

                                {file.status === 'done' ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : file.status === 'error' ? (
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                ) : file.status !== 'pending' ? (
                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        {results.filter(r => r.status === 'done').length} / {results.length} processed
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setFiles([]); setResults([]); }}
                            disabled={isProcessing || results.length === 0}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Clear Queue
                        </button>
                        <button 
                            onClick={processBatch}
                            disabled={isProcessing || results.length === 0 || results.every(r => r.status === 'done')}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {isProcessing ? 'Processing...' : 'Start Import'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    </AnimatePresence>
  );
};
