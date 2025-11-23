
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, FileType, Eye, ChevronRight, ChevronDown, Layout } from 'lucide-react';
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

interface ProcessedFile {
  id: string;
  fileName: string;
  status: 'pending' | 'parsing' | 'clustering' | 'saving' | 'done' | 'error';
  detectedTitle?: string;
  detectedArtist?: string;
  albumAction?: 'created' | 'linked' | 'none';
  errorMsg?: string;
  previewText?: string; 
}

// --- CONSTANTS & REGEX ---
const META_FILTER_REGEX = /^(difficulty|tuning|capo|tabbed by|strumming|bpm|page|author|key|time sig|date|chords used|artist|title)/i;
// Strict Chord Regex for individual tokens
const CHORD_TOKEN_STRICT = /^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?(?:\([^\)]+\))?$/;

// --- TYPES FOR SPATIAL ENGINE ---
interface TextItem {
    str: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface PDFRow {
    y: number; // Vertical centroid
    items: TextItem[];
    type: 'chord' | 'lyric' | 'header' | 'meta' | 'empty';
    text: string;
}

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

  // --- SPATIAL ENGINE LOGIC ---

  const classifyRow = (items: TextItem[]): PDFRow['type'] => {
      const fullText = items.map(i => i.str).join('').trim();
      if (!fullText) return 'empty';

      // 1. Metadata / Page Numbers
      if (META_FILTER_REGEX.test(fullText) || /^\d+\s*(\/|of)\s*\d+$/.test(fullText)) {
          return 'meta';
      }

      // 2. Headers (e.g. [Chorus], Intro:)
      if (/^\[.+\]$/.test(fullText) || /^(Chorus|Verse|Bridge|Intro|Outro|Instrumental).*:/i.test(fullText)) {
          return 'header';
      }

      // 3. Chord Analysis
      // We tokenize by looking at individual items or splitting the string
      const tokens = fullText.split(/\s+/).filter(t => t.length > 0);
      if (tokens.length === 0) return 'empty';

      let chordCount = 0;
      let lyricWordCount = 0;

      tokens.forEach(t => {
          // Clean punctuation
          const clean = t.replace(/[\(\)\[\]]/g, '');
          if (CHORD_TOKEN_STRICT.test(clean)) {
              chordCount++;
          } else {
              // Basic check for lyric-like words
              if (clean.length > 1 || (clean === 'I' || clean === 'a')) {
                  lyricWordCount++;
              }
          }
      });

      // Heuristics
      const isMajorityChords = chordCount > lyricWordCount;
      const hasLyricsKeywords = /\b(the|and|you|that|was|for|are|with|heart|love|when|what|your)\b/i.test(fullText);

      if (isMajorityChords && !hasLyricsKeywords) return 'chord';
      return 'lyric';
  };

  const extractRawPdfItems = async (file: File): Promise<TextItem[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const allItems: TextItem[] = [];
      
      // Limit pages to prevent browser crash on huge books
      const maxPages = Math.min(pdf.numPages, 5); 

      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });

          textContent.items.forEach((item: any) => {
              // Transform: [scaleX, skewY, skewX, scaleY, x, y]
              // PDF coords: (0,0) is usually bottom-left. We invert Y to make it top-down.
              const tx = item.transform;
              const x = tx[4];
              const y = viewport.height - tx[5]; 
              const w = item.width;
              const h = item.height || 10;
              
              if (item.str.trim().length > 0) {
                  allItems.push({ str: item.str, x, y, w, h });
              }
          });
      }
      return allItems;
  };

  const processPdfToChordPro = async (file: File): Promise<{ text: string, title: string, artist: string }> => {
      const items = await extractRawPdfItems(file);
      
      // 1. Cluster items into visual rows
      // Sort by Y (vertical) then X (horizontal)
      items.sort((a, b) => (Math.abs(a.y - b.y) < 5) ? (a.x - b.x) : (a.y - b.y));

      const rows: PDFRow[] = [];
      let currentRow: TextItem[] = [];
      let currentY = items[0]?.y || 0;

      items.forEach(item => {
          // If vertical distance > tolerance, start new row
          if (Math.abs(item.y - currentY) > 8) { 
              if (currentRow.length > 0) {
                  // Sort items horizontally in the row
                  currentRow.sort((a, b) => a.x - b.x);
                  rows.push({
                      y: currentY,
                      items: currentRow,
                      type: classifyRow(currentRow),
                      text: currentRow.map(i => i.str).join('') // Raw text for display/fallback
                  });
              }
              currentRow = [item];
              currentY = item.y;
          } else {
              currentRow.push(item);
          }
      });
      // Push last row
      if (currentRow.length > 0) {
          currentRow.sort((a, b) => a.x - b.x);
          rows.push({ y: currentY, items: currentRow, type: classifyRow(currentRow), text: currentRow.map(i => i.str).join('') });
      }

      // 2. Metadata Extraction (First few rows)
      let title = file.name.replace('.pdf', '');
      let artist = 'Unknown Artist';
      
      // Try to find title/artist in first 5 lines
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const txt = rows[i].text;
          if (txt.toLowerCase().includes(' by ')) {
              const parts = txt.split(/ by /i);
              if (parts.length === 2) {
                  title = parts[0].trim();
                  artist = parts[1].trim();
                  break;
              }
          }
      }

      // 3. Spatial Merge (The Core Logic)
      const outputLines: string[] = [];
      
      for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const nextRow = i + 1 < rows.length ? rows[i + 1] : null;

          if (row.type === 'meta' || row.type === 'empty') continue;

          if (row.type === 'header') {
              // Clean header
              const cleaned = row.text.replace(/[:\[\]]/g, '').trim();
              outputLines.push(`\n{comment: ${cleaned}}`);
              continue;
          }

          if (row.type === 'chord') {
              // Check if we can merge with next row
              if (nextRow && nextRow.type === 'lyric') {
                  // === SPATIAL MERGE START ===
                  
                  // 1. Construct a detailed map of the lyric line with char positions
                  // We need to interpolate X positions for every character in the lyric line
                  const lyricMap: { char: string, x: number }[] = [];
                  
                  // Helper to create linear interpolation for lyric items
                  nextRow.items.forEach((item, idx) => {
                      // If there's a gap from previous item, insert spaces
                      const prevItemEnd = idx > 0 ? (nextRow.items[idx-1].x + nextRow.items[idx-1].w) : item.x;
                      const gap = item.x - prevItemEnd;
                      
                      if (gap > 5) { // 5px threshold for space
                          const spaceCount = Math.max(1, Math.floor(gap / 6)); // Assume ~6px per char
                          for(let s=0; s<spaceCount; s++) {
                              lyricMap.push({ char: ' ', x: prevItemEnd + (s*6) });
                          }
                      }

                      const chars = item.str.split('');
                      const charWidth = item.w / chars.length;
                      
                      chars.forEach((char, charIdx) => {
                          lyricMap.push({ 
                              char, 
                              x: item.x + (charIdx * charWidth) 
                          });
                      });
                  });

                  // 2. Insert chords into the lyric string based on X overlap
                  // We create an array of insertions to apply later
                  const insertions: { index: number, text: string }[] = [];

                  row.items.forEach(chordItem => {
                      // Split if multiple chords in one item (rare but possible)
                      const chords = chordItem.str.split(/\s+/).filter(c => c.length > 0);
                      // Distribute them uniformly across item width if multiple
                      const subWidth = chordItem.w / chords.length;
                      
                      chords.forEach((chord, cIdx) => {
                          if (!CHORD_TOKEN_STRICT.test(chord.replace(/[\(\)]/g,''))) return;
                          
                          const chordCenter = chordItem.x + (cIdx * subWidth);
                          
                          // Find closest char in lyric map
                          let closestIdx = lyricMap.length; // Default to end
                          let minDist = 9999;

                          for (let m = 0; m < lyricMap.length; m++) {
                              const dist = Math.abs(lyricMap[m].x - chordCenter);
                              if (dist < minDist) {
                                  minDist = dist;
                                  closestIdx = m;
                              }
                          }
                          
                          // Adjust for line bounds
                          if (closestIdx > lyricMap.length) closestIdx = lyricMap.length;
                          
                          insertions.push({ index: closestIdx, text: `[${chord}]` });
                      });
                  });

                  // 3. Build final string
                  // Sort insertions by index descending to avoid shifting
                  insertions.sort((a, b) => b.index - a.index);
                  
                  // Reconstruct lyric string
                  let finalLine = lyricMap.map(m => m.char).join('');
                  
                  insertions.forEach(ins => {
                      // Handle edge case: insertion beyond length
                      if (ins.index >= finalLine.length) {
                          finalLine += ins.text;
                      } else {
                          finalLine = finalLine.slice(0, ins.index) + ins.text + finalLine.slice(ins.index);
                      }
                  });

                  outputLines.push(finalLine);
                  i++; // Skip next row since we merged it
              } 
              else {
                  // Orphan chord line (e.g. Intro) - just wrap in brackets
                  const wrapped = row.items.map(i => {
                      const chords = i.str.split(/\s+/).filter(c => c);
                      return chords.map(c => {
                          if (CHORD_TOKEN_STRICT.test(c.replace(/[\(\)]/g,''))) return `[${c}]`;
                          return c;
                      }).join(' ');
                  }).join(' ');
                  outputLines.push(wrapped);
              }
          }
          else if (row.type === 'lyric') {
              outputLines.push(row.text);
          }
      }

      return {
          text: outputLines.join('\n'),
          title,
          artist
      };
  };

  const ensureAlbum = async (artistName: string): Promise<{ id: string, action: 'created' | 'linked' | 'none' }> => {
      if (!artistName || artistName === 'Unknown Artist') return { id: '', action: 'none' };
      const normalized = artistName.toLowerCase().trim();
      
      const { data: existingData } = await supabase
        .from('albums').select('id').ilike('artist', normalized).limit(1);

      if (existingData && existingData.length > 0) {
          return { id: existingData[0].id, action: 'linked' };
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
              
              // Run the new Spatial Engine
              const { text: chordPro, title, artist } = await processPdfToChordPro(file);
              
              updateStatus({ detectedTitle: title, detectedArtist: artist, previewText: chordPro });

              const parsedChords = parseChordsFromText(chordPro);

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
                            <Layout className="w-5 h-5 text-primary" /> Spatial PDF Importer v2.0
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">High-Fidelity conversion using exact coordinate mapping.</p>
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
                        <p className="text-xs text-slate-500 mt-2">Supports: Standard text-based PDF Chord Sheets</p>
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
                                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">ChordPro Preview:</p>
                                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-white/5 max-h-40 overflow-y-auto leading-relaxed">
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
