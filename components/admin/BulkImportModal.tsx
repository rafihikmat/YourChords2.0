
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, FileType, Eye, ChevronRight, ChevronDown } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { parseChordsFromText } from '../../lib/musicUtils';
import { cn } from '../../lib/utils';

// Dynamically resolve worker version
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
  previewText?: string; // For debugging/verifying
}

// --- CONSTANTS & REGEX ---
// Filter out tab metadata and junk lines
const META_FILTER_REGEX = /^(difficulty|tuning|capo|tabbed by|strumming|bpm|page|author|key|time sig|date|chords used)/i;
const TAB_LINE_REGEX = /^[-0-9|hpx\/\\]{5,}$/; 
// STRICT Chord Regex: Matches standard chord notation
const CHORD_STRICT_REGEX = /\b[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?(?:\([^\)]+\))?\b/g;

// --- HELPER: DETECT CHORD LINE ---
const isChordLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // 1. Fail immediately if common lyric words exist (lowercased check)
    if (/\b(the|and|you|that|was|for|are|with|his|they|this|sent|heart|love|when|what|your|from|have|text|through|sending|moonlight|giving|honor|lose|fire|miles)\b/i.test(trimmed)) return false;

    // 2. Token Density Check
    const tokens = trimmed.split(/\s+/);
    let chordCount = 0;
    
    tokens.forEach(t => {
        // Strip parens/brackets for clean check
        const cleanT = t.replace(/[\(\)\[\]]/g, '');
        // Must match chord regex strictly
        if (/^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?$/.test(cleanT)) {
            chordCount++;
        }
    });

    // Threshold: If > 50% of tokens are chords, it's a chord line
    // This handles lines like "A  D  E" (100%) vs "I love you" (0%)
    return (chordCount / tokens.length) > 0.5;
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

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

  // --- SPATIAL TEXT EXTRACTION ENGINE (IMPROVED) ---
  const extractTextWithLayout = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullOutput = '';
      const maxPages = Math.min(pdf.numPages, 10); // Increased page limit
      
      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });

          const items = textContent.items.map((item: any) => ({
              str: item.str,
              x: item.transform[4],
              y: viewport.height - item.transform[5], 
              width: item.width,
              height: item.height || 10
          })).filter(item => item.str.trim().length > 0); // Keep non-empty items

          items.sort((a, b) => {
              if (Math.abs(a.y - b.y) < 4) return a.x - b.x; 
              return a.y - b.y;
          });

          // 3. Dynamic Row Clustering
          const rows: { y: number, items: typeof items }[] = [];
          // Increased tolerance to catch superscripts (e.g., '7' in 'A7')
          const Y_TOLERANCE = 6; 

          items.forEach(item => {
              const row = rows.find(r => Math.abs(r.y - item.y) <= Y_TOLERANCE);
              if (row) {
                  row.items.push(item);
              } else {
                  rows.push({ y: item.y, items: [item] });
              }
          });

          // 4. Construct Strings using DYNAMIC SPACING
          const pageLines = rows.map(row => {
              row.items.sort((a, b) => a.x - b.x);

              // CALCULATE AVERAGE CHAR WIDTH FOR THIS ROW
              // This creates a relative grid for this specific line's font size
              const totalWidth = row.items.reduce((sum, it) => sum + (it.width || 0), 0);
              const totalChars = row.items.reduce((sum, it) => sum + it.str.length, 0);
              // Fallback to 4px if calc fails (e.g. empty glyphs)
              const avgCharWidth = (totalChars > 0 && totalWidth > 0) ? (totalWidth / totalChars) : 4; 

              let lineText = "";
              let currentX = 0; 

              // If row starts indented, add initial padding
              if (row.items.length > 0) {
                  const startGap = row.items[0].x;
                  if (startGap > 20) { // Only indent if significant
                      const indentSpaces = Math.round(startGap / avgCharWidth);
                      lineText += " ".repeat(Math.min(indentSpaces, 20)); 
                  }
                  currentX = row.items[0].x; // Start tracking from first item
              }

              row.items.forEach(item => {
                  const gap = item.x - currentX;
                  
                  if (gap > 2) {
                      // Use the row's specific average char width to calculate spaces
                      const spaces = Math.round(gap / avgCharWidth);
                      // Cap spaces to prevent massive gaps
                      lineText += " ".repeat(Math.max(0, Math.min(spaces, 60)));
                  }
                  
                  lineText += item.str;
                  currentX = item.x + (item.width || (item.str.length * avgCharWidth));
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

      // Filter Metadata lines
      lines = lines.filter(line => {
          const clean = line.trim();
          if (!clean) return false;
          if (META_FILTER_REGEX.test(clean)) return false;
          if (TAB_LINE_REGEX.test(clean.replace(/\s/g, ''))) return false; 
          if (/^\d+\s*\/\s*\d+$/.test(clean)) return false; 
          return true;
      });

      for (let i = 0; i < lines.length; i++) {
          const currentLine = lines[i];
          const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

          // Check for Headers (e.g., [Chorus], Intro:)
          const trimmed = currentLine.trim();
          if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge|Intro|Outro|Instrumental).*:/i.test(trimmed)) {
              const headerName = trimmed.replace(/[:\[\]]/g, '').trim();
              processedLines.push(`{comment: ${headerName}}`);
              continue;
          }

          // If CHORD LINE detected
          if (isChordLine(currentLine)) {
              // Determine if we should merge with next line
              let shouldMerge = false;

              if (nextLine) {
                  const nextTrimmed = nextLine.trim();
                  const nextIsHeader = /^\[.+\]$/.test(nextTrimmed);
                  const nextIsChord = isChordLine(nextLine);
                  const nextIsEmpty = nextTrimmed.length === 0;

                  // MERGE ONLY IF:
                  // 1. Next line is NOT a chord line
                  // 2. Next line is NOT a header
                  // 3. Next line is NOT empty
                  if (!nextIsChord && !nextIsHeader && !nextIsEmpty) {
                      shouldMerge = true;
                  }
              }

              if (shouldMerge && nextLine) {
                  // === SMART MERGE ===
                  let resultLine = "";
                  let bufferLine = nextLine; // The lyric line
                  
                  const chordMatches = [...currentLine.matchAll(CHORD_STRICT_REGEX)];
                  let currentIdx = 0;

                  if (chordMatches.length === 0) {
                      // Safety: detected as chord line but regex failed? preserve lyrics
                      processedLines.push(nextLine);
                  } else {
                      chordMatches.forEach(match => {
                          const chordStr = match[0];
                          const visualIndex = match.index!;
                          
                          // Append text from lyric line UP TO this chord's position
                          if (visualIndex > currentIdx) {
                              if (currentIdx < bufferLine.length) {
                                  // If visualIndex is beyond lyric length, just append remaining and space
                                  const endSlice = Math.min(visualIndex, bufferLine.length);
                                  resultLine += bufferLine.slice(currentIdx, endSlice);
                                  
                                  // If chord is way to the right of lyrics, add padding spaces
                                  if (visualIndex > bufferLine.length) {
                                       resultLine += " ".repeat(visualIndex - bufferLine.length);
                                  }
                              } else {
                                  // Lyrics already finished, just adding spacing for trailing chords
                                  resultLine += " ".repeat(visualIndex - currentIdx);
                              }
                          } else if (visualIndex < currentIdx) {
                              // Overlap edge case (rare with sorted items), usually fine to ignore backstep
                          }
                          
                          resultLine += `[${chordStr}]`;
                          currentIdx = Math.max(currentIdx, visualIndex); // Advance cursor but don't double count
                          // Ideally currentIdx becomes visualIndex, but since we inserted [Chord], string length changed.
                          // We are consuming `bufferLine` using `visualIndex` as the pointer to original layout.
                          currentIdx = visualIndex; 
                      });

                      // Append any remaining lyrics after the last chord
                      if (currentIdx < bufferLine.length) {
                          resultLine += bufferLine.slice(currentIdx);
                      }
                      processedLines.push(resultLine);
                  }
                  i++; // Skip next line (lyrics) since we merged it
              } 
              else {
                  // === ORPHAN CHORD LINE (Intro, Solo, or end of song) ===
                  // Wrap all chords in brackets so parser sees them as chords, not lyrics
                  const wrapped = currentLine.replace(CHORD_STRICT_REGEX, '[$&]');
                  processedLines.push(wrapped);
              }
          } else {
              // Pure Lyric Line (orphaned lyrics)
              processedLines.push(currentLine);
          }
      }

      return processedLines.join('\n')
          .replace(/\[([A-G][#b]?)\/\]/g, '[$1]') // Fix trailing slash
          .replace(/\s{2,}/g, ' '); // Clean excess whitespace
  };

  const parseMetadata = (text: string, fileName: string) => {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let title = fileName.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      let artist = 'Unknown Artist';
      
      // Heuristic: "Song by Artist" or "Song - Artist"
      // Check first 3 lines for specific patterns
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
          const l = lines[i];
          if (l.toLowerCase().includes(' by ')) {
              const parts = l.split(/ by /i);
              if (parts.length === 2) {
                  // Usually "Title by Artist"
                  if(parts[0].length < 40 && parts[1].length < 40) {
                      title = parts[0].trim();
                      artist = parts[1].trim();
                      break;
                  }
              }
          }
      }
      
      // Fallback: Hyphen in filename
      if (artist === 'Unknown Artist' && title.includes('-')) {
          const parts = title.split('-');
          if (parts.length >= 2) {
              // Often "Artist - Title" in filenames
              artist = parts[0].trim();
              title = parts.slice(1).join('-').trim();
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
              
              // Store raw text for preview
              updateStatus({ previewText: finalChordPro });

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

  const togglePreview = (id: string) => {
      setExpandedPreviewId(expandedPreviewId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileType className="w-5 h-5 text-primary" /> Smart PDF Importer
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Features "Spatial Alignment" for improved chord/lyric merging.</p>
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
                        <p className="text-xs text-slate-500 mt-2">Supports: Bulk Standard Chord Sheets (Text-based)</p>
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
                            <div key={file.id} className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                                <div className="flex items-center gap-4 p-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10">
                                        <FileText className="w-4 h-4 text-red-500" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.fileName}>{file.fileName}</p>
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

                                    {file.previewText && (
                                        <button 
                                            onClick={() => togglePreview(file.id)}
                                            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
                                            title="View Parsed Text"
                                        >
                                            {expandedPreviewId === file.id ? <ChevronDown className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {file.status === 'done' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : file.status === 'error' ? (
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    ) : file.status !== 'pending' ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    ) : null}
                                </div>

                                {expandedPreviewId === file.id && (
                                    <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 animate-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Parsed ChordPro Preview:</p>
                                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-white/5 max-h-40 overflow-y-auto">
                                            {file.previewText}
                                        </pre>
                                    </div>
                                )}
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
