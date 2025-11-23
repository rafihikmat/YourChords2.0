
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, FileType } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { parseChordsFromText } from '../../lib/musicUtils';
import { cn } from '../../lib/utils';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// LOCAL INTERFACE FOR TYPE ASSERTION
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
const META_FILTER_REGEX = /^(difficulty|tuning|capo|tabbed by|strumming|bpm|page|author|key|time sig)/i;
const TAB_LINE_REGEX = /^[-0-9|hpx\/\\]{5,}$/; // Detects e|--0--2--|
const CHORD_STRICT_REGEX = /\b[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o)*(?:\/[A-G][#b]?)?\b/g;

// --- HELPER: DETECT CHORD LINE ---
// Returns true if the line is overwhelmingly composed of chords and spaces
const isChordLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // 1. If it contains obvious lyric words, it's not a chord line
    // (Simple stoplist for common words)
    if (/\b(the|and|you|that|was|for|are|with|his|they|this)\b/i.test(trimmed)) return false;

    // 2. Calculate density
    const tokens = trimmed.split(/\s+/);
    let chordCount = 0;
    
    tokens.forEach(t => {
        if (t.match(/^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o)*(?:\/[A-G][#b]?)?$/)) {
            chordCount++;
        }
    });

    // If > 80% of tokens are chords, it's a chord line
    return (chordCount / tokens.length) > 0.8;
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- DRAG & DROP HANDLERS ---
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
    
    // Explicitly type 'f' to ensure 'type' property is accessible
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
        setResults(prev => [
            ...prev, 
            ...droppedFiles.map(f => ({ 
                id: Math.random().toString(36).substr(2, 9), 
                fileName: f.name, 
                status: 'pending' 
            } as ProcessedFile))
        ]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          // Explicitly type 'f' to ensure 'type' property is accessible
          const selected = Array.from(e.target.files).filter((f: File) => f.type === 'application/pdf');
          setFiles(prev => [...prev, ...selected]);
          setResults(prev => [
            ...prev, 
            ...selected.map(f => ({ 
                id: Math.random().toString(36).substr(2, 9), 
                fileName: f.name, 
                status: 'pending' 
            } as ProcessedFile))
        ]);
      }
  };

  // --- CORE LOGIC: EXTRACT TEXT WITH SPATIAL AWARENESS ---
  const extractTextWithLayout = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullOutput = '';
      
      // Limit pages to avoid huge docs
      const maxPages = Math.min(pdf.numPages, 5);
      
      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Group items by Y coordinate (Row detection)
          // PDF Y-coordinates originate from bottom-left usually.
          const rows: Record<number, { str: string, x: number }[]> = {};
          
          textContent.items.forEach((item: any) => {
              // Transform: [scaleX, skewY, skewX, scaleY, x, y]
              const y = Math.round(item.transform[5]); // Round to group slight misalignments
              const x = item.transform[4];
              const str = item.str;
              
              if (!str.trim()) return; // Skip empty visual items

              if (!rows[y]) rows[y] = [];
              rows[y].push({ str, x });
          });

          // Sort rows by Y descending (Top to Bottom)
          const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);
          
          // Construct text lines
          const pageLines: string[] = [];
          
          sortedY.forEach(y => {
              // Sort items in this row by X ascending (Left to Right)
              const items = rows[y].sort((a, b) => a.x - b.x);
              
              let lineStr = "";
              let lastX = 0;
              
              // Approximate character width (heuristic)
              const charWidth = 4; 

              items.forEach(item => {
                  // Calculate gap
                  const gap = item.x - lastX;
                  // If gap is significant, insert spaces
                  if (gap > charWidth && lastX !== 0) {
                      const spaces = Math.floor(gap / charWidth);
                      lineStr += " ".repeat(Math.min(spaces, 20)); // Cap spaces to prevent wild jumps
                  }
                  lineStr += item.str;
                  lastX = item.x + (item.str.length * charWidth);
              });
              
              pageLines.push(lineStr);
          });
          
          fullOutput += pageLines.join('\n') + '\n';
      }
      return fullOutput;
  };

  // --- CORE LOGIC: CLEAN & MERGE CHORDS ---
  const cleanAndMergeChords = (rawText: string): string => {
      let lines = rawText.split('\n');
      const processedLines: string[] = [];

      // 1. Initial Cleaning
      lines = lines.filter(line => {
          const clean = line.trim();
          if (!clean) return false; // Remove empty lines
          if (META_FILTER_REGEX.test(clean)) return false; // Remove metadata
          if (TAB_LINE_REGEX.test(clean.replace(/\s/g, ''))) return false; // Remove ascii tabs
          if (/^\d+$/.test(clean)) return false; // Remove standalone page numbers
          return true;
      });

      // 2. Vertical Merging Logic
      for (let i = 0; i < lines.length; i++) {
          const currentLine = lines[i];
          // Look ahead safely
          const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

          // Scenario A: Chord Line above Lyric Line -> MERGE
          if (isChordLine(currentLine)) {
              if (nextLine && !isChordLine(nextLine) && nextLine.trim().length > 0) {
                  // --- MERGE ALGORITHM ---
                  let mergedLine = nextLine;
                  const matches = [...currentLine.matchAll(CHORD_STRICT_REGEX)];
                  
                  // We process matches from Right to Left to prevent index shifting issues
                  matches.reverse().forEach(match => {
                      const chord = match[0];
                      const index = match.index || 0;
                      
                      // Pad the lyric line if the chord extends beyond it
                      if (index >= mergedLine.length) {
                          mergedLine += " ".repeat(index - mergedLine.length);
                      }
                      
                      // Insert the chord [C] at the specific index
                      const part1 = mergedLine.slice(0, index);
                      const part2 = mergedLine.slice(index);
                      mergedLine = `${part1}[${chord}]${part2}`;
                  });
                  
                  processedLines.push(mergedLine);
                  i++; // SKIP the next line because we just consumed it
              } 
              else {
                  // Scenario B: Chord Line with no lyrics below (Intro/Outro) -> WRAP
                  const wrapped = currentLine.replace(CHORD_STRICT_REGEX, '[$&]');
                  processedLines.push(wrapped);
              }
          } 
          else {
              // Scenario C: Just Lyrics (or header) -> KEEP
              // Detect Header style like "Chorus:" or "[Chorus]"
              const trimmed = currentLine.trim();
              if (/^\[.+\]$/.test(trimmed) || /^(Chorus|Verse|Bridge).*:/i.test(trimmed)) {
                  const headerName = trimmed.replace(/[:\[\]]/g, '').trim();
                  processedLines.push(`{comment: ${headerName}}`);
              } else {
                  processedLines.push(currentLine);
              }
          }
      }

      // 3. Final Polish
      return processedLines
          .join('\n')
          .replace(/\[([A-G][#b]?)\/\]/g, '[$1]') // Fix broken slash chords e.g. [A/] -> [A]
          .replace(/\s{2,}/g, ' '); // Collapse excess whitespace in lyrics
  };

  const parseMetadata = (text: string, fileName: string) => {
      // Try to extract Title/Artist from first few lines before we processed them deeply
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let title = fileName.replace(/\.pdf$/i, '');
      let artist = 'Unknown Artist';
      
      // Simple heuristic: "Song by Artist" or lines 1 & 2
      const byLine = lines.find(l => /\bby\b/i.test(l));
      if (byLine) {
          const parts = byLine.split(/\bby\b/i);
          if (parts.length > 1) {
              artist = parts[1].trim();
              // If the line before 'by' exists, it might be title
              const idx = lines.indexOf(byLine);
              if (idx > 0) title = lines[idx-1];
          }
      } else if (lines.length >= 2) {
          // Check if first line is NOT a chord line
          if (!isChordLine(lines[0])) {
              title = lines[0];
              if (!isChordLine(lines[1]) && lines[1].length < 50) {
                  artist = lines[1];
              }
          }
      }
      
      // Clean filename artifacts
      title = title.replace(/[-_]/g, ' ').replace(/\d/g, '').trim();
      
      return { title, artist };
  };

  // --- ALBUM CLUSTERING LOGIC ---
  const ensureAlbum = async (artistName: string): Promise<{ id: string, action: 'created' | 'linked' | 'none' }> => {
      if (!artistName || artistName === 'Unknown Artist') return { id: '', action: 'none' };

      const normalized = artistName.toLowerCase().trim();
      
      const { data: existingData } = await supabase
        .from('albums')
        .select('id, artist')
        .ilike('artist', normalized)
        .limit(1);

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
        .select()
        .single();

      if (error || !newAlbumData) return { id: '', action: 'none' };
      
      const newAlbum = newAlbumData as unknown as AlbumRow;
      return { id: newAlbum.id, action: 'created' };
  };

  const processBatch = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (results[i].status === 'done') continue; // Skip already done

          const updateStatus = (s: Partial<ProcessedFile>) => {
              setResults(prev => {
                  const next = [...prev];
                  next[i] = { ...next[i], ...s };
                  return next;
              });
          };

          try {
              updateStatus({ status: 'parsing' });
              
              // 1. Advanced Extraction
              const rawTextWithLayout = await extractTextWithLayout(file);
              const { title, artist } = parseMetadata(rawTextWithLayout, file.name);
              updateStatus({ detectedTitle: title, detectedArtist: artist });

              // 2. Smart Cleaning & Merging
              const finalChordPro = cleanAndMergeChords(rawTextWithLayout);
              
              // 3. Database Prep
              const parsedChords = parseChordsFromText(finalChordPro); // Legacy compatibility

              updateStatus({ status: 'clustering' });
              const { id: albumId, action } = await ensureAlbum(artist);
              
              updateStatus({ status: 'saving', albumAction: action });
              
              const { error } = await supabase.from('songs').insert([{
                  title,
                  artist,
                  difficulty: 'Medium', 
                  album_id: albumId || null,
                  chords: parsedChords, // Saves structured format
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
                        <p className="text-xs text-slate-500 mt-1">Uses visual layout analysis to merge chords and lyrics perfectly.</p>
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
                        <p className="text-xs text-slate-500 mt-2">Auto-aligns chords, removes metadata, and groups albums.</p>
                    </label>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar min-h-[200px]">
                    <div className="space-y-2">
                        {results.length === 0 && (
                            <div className="text-center py-10 text-slate-400 italic text-sm">
                                No files queued.
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
                            Clear
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
