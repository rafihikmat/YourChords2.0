
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, Eye, ChevronDown, Layout, Ban } from 'lucide-react';
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

// --- GRID ENGINE TYPES ---
interface GridItem {
    str: string;
    x: number;
    y: number; // PDF Y coordinates (0 at bottom)
    w: number;
    h: number;
}

interface GridRow {
    y: number; // Centroid Y
    items: GridItem[];
    text: string; // Full concatenated text
    type: 'chord' | 'lyric' | 'header' | 'meta' | 'garbage';
}

// --- REGEX PATTERNS ---
// Patterns that trigger immediate row deletion
const TRASH_PATTERNS = [
    /^(difficulty|tuning|capo|key|strumming|bpm|author|tabbed by|generated using|http|www\.|copyright|page \d|chords used)/i,
    /^e\|-+/i, // Tablature lines
    /^\|-+/i,  // Tablature lines
    /^[x0-9\s]{5,}$/ // Chord diagrams like "x 0 2 2 2 0"
];

// Heuristic to identify chord lines (allow specific extensions)
const CHORD_TOKEN_REGEX = /^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|7|9|11|13|5|6|o|\+|M)*(?:\/[A-G][#b]?)?(?:\([^\)]+\))?$/;

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
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f: any) => f.type === 'application/pdf') as File[];
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
          const selected = Array.from(e.target.files).filter((f: any) => f.type === 'application/pdf') as File[];
          setFiles(prev => [...prev, ...selected]);
          setResults(prev => [...prev, ...selected.map(f => ({ 
                id: Math.random().toString(36).substr(2, 9), 
                fileName: f.name, 
                status: 'pending' 
            } as ProcessedFile))]);
      }
  };

  // --- CORE GRID ENGINE ---

  const classifyRow = (text: string): GridRow['type'] => {
      const clean = text.trim();
      if (!clean) return 'garbage';

      // 1. Filter Trash
      if (TRASH_PATTERNS.some(p => p.test(clean))) return 'meta';
      
      // 2. Detect Headers
      if (/^(chorus|verse|bridge|intro|outro|instrumental|pre-chorus).*:/i.test(clean) || /^\[.+\]$/.test(clean)) {
          return 'header';
      }
      if (/^(chorus|verse|bridge)$/i.test(clean)) return 'header'; // Loose headers

      // 3. Detect Chords
      const tokens = clean.split(/\s+/).filter(t => t);
      const chordCount = tokens.filter(t => CHORD_TOKEN_REGEX.test(t.replace(/[\(\)]/g, ''))).length;
      
      // If > 60% of tokens look like chords, treat as chord line
      if (chordCount / tokens.length > 0.6) return 'chord';

      return 'lyric';
  };

  const extractGridItems = async (file: File): Promise<GridItem[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const items: GridItem[] = [];
      
      // Limit to first 5 pages to prevent overload
      const maxPages = Math.min(pdf.numPages, 5); 

      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // Viewport needed for normalization (PDF coords are bottom-up)
          const viewport = page.getViewport({ scale: 1.0 }); 

          textContent.items.forEach((item: any) => {
              // item.transform: [scaleX, skewY, skewX, scaleY, x, y]
              // In PDF, (0,0) is bottom-left. 
              const tx = item.transform;
              const x = tx[4];
              const y = tx[5]; // Keep raw PDF Y for now, sort desc later
              const w = item.width;
              const h = item.height || 10;
              const str = item.str;

              if (str.trim().length > 0) {
                  items.push({ str, x, y, w, h });
              }
          });
      }
      return items;
  };

  const processPdfToChordPro = async (file: File): Promise<{ text: string, title: string, artist: string }> => {
      const rawItems = await extractGridItems(file);

      // --- PHASE 1: ROW GROUPING ---
      // Sort by Y descending (Top to Bottom), then X ascending
      rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

      const rows: GridRow[] = [];
      let currentRow: GridItem[] = [];
      let currentY = rawItems[0]?.y || 0;

      // Tolerance for Y grouping (lines are roughly same height)
      const TOLERANCE = 4; 

      rawItems.forEach(item => {
          if (Math.abs(item.y - currentY) > TOLERANCE) {
              // New row detected
              if (currentRow.length > 0) {
                  // Sort items left-to-right strictly
                  currentRow.sort((a, b) => a.x - b.x);
                  const rowText = currentRow.map(i => i.str).join('').replace(/\s+/g, ' '); // Normalized space for classification
                  rows.push({
                      y: currentY,
                      items: currentRow,
                      text: rowText,
                      type: classifyRow(rowText)
                  });
              }
              currentRow = [item];
              currentY = item.y;
          } else {
              currentRow.push(item);
          }
      });
      // Flush last row
      if (currentRow.length > 0) {
          currentRow.sort((a, b) => a.x - b.x);
          const rowText = currentRow.map(i => i.str).join('').replace(/\s+/g, ' ');
          rows.push({ y: currentY, items: currentRow, text: rowText, type: classifyRow(rowText) });
      }

      // --- PHASE 2: META EXTRACTION & CLEANING ---
      // Extract metadata from top rows before we delete them
      let title = file.name.replace('.pdf', '');
      let artist = 'Unknown Artist';

      // Look for "Title by Artist" pattern in first 5 rows
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const txt = rows[i].text;
          if (txt.toLowerCase().includes(' by ')) {
              const parts = txt.split(/ by /i);
              if (parts.length === 2 && parts[0].length < 50 && parts[1].length < 50) {
                  title = parts[0].trim();
                  artist = parts[1].trim();
                  break;
              }
          }
      }

      // Filter out garbage rows
      const cleanRows = rows.filter(r => r.type !== 'meta' && r.type !== 'garbage');

      // --- PHASE 3: VISUAL MERGE ---
      const output: string[] = [];
      
      for (let i = 0; i < cleanRows.length; i++) {
          const row = cleanRows[i];
          const nextRow = i + 1 < cleanRows.length ? cleanRows[i + 1] : null;

          if (row.type === 'header') {
              const header = row.text.replace(/[:\[\]]/g, '').trim();
              // Deduplication: Don't add header if previous line was same header
              if (output.length === 0 || !output[output.length - 1].includes(header)) {
                  output.push(`\n{comment: ${header}}`);
              }
              continue;
          }

          if (row.type === 'chord') {
              // CHECK: Is the next row Lyrics?
              if (nextRow && nextRow.type === 'lyric') {
                  // === SPATIAL OVERLAY ALGORITHM ===
                  
                  // 1. Build Character Map of Lyric Line
                  // Interpolate X position for every character
                  const charMap: { char: string, x: number }[] = [];
                  
                  nextRow.items.forEach((item, idx) => {
                      // Check for gap from previous item -> Insert Spaces
                      if (idx > 0) {
                          const prev = nextRow.items[idx - 1];
                          const gap = item.x - (prev.x + prev.w);
                          if (gap > 4) { // 4px threshold
                              const spaces = Math.floor(gap / 4); // Approx space width
                              for (let s = 0; s < spaces; s++) {
                                  charMap.push({ char: ' ', x: prev.x + prev.w + (s * 4) });
                              }
                          }
                      }

                      const chars = item.str.split('');
                      const charWidth = item.w / chars.length;
                      chars.forEach((c, cIdx) => {
                          charMap.push({ char: c, x: item.x + (cIdx * charWidth) });
                      });
                  });

                  // 2. Insert Chords
                  // Create array of insertions { index: number, text: string }
                  const insertions: { index: number, text: string }[] = [];

                  row.items.forEach(chordItem => {
                      // Handle cases where one item contains multiple chords "C G"
                      const parts = chordItem.str.split(/(\s+)/); // Keep delimiters to calculate offset
                      let localOffset = 0;
                      const partWidth = chordItem.w / chordItem.str.length; // Approx char width in chord line

                      parts.forEach(part => {
                          if (!part.trim()) {
                              localOffset += part.length * partWidth;
                              return;
                          }
                          
                          // Clean & Normalize Chord
                          let chord = part.trim();
                          // Normalization: A+ -> Aaug, Amaj -> Amaj7 (heuristic)
                          chord = chord.replace('+', 'aug').replace('maj', 'maj7').replace('min', 'm');
                          // Remove '77' typo if present, ensure basic validity
                          if (!CHORD_TOKEN_REGEX.test(chord)) {
                              localOffset += part.length * partWidth;
                              return;
                          }

                          const chordX = chordItem.x + localOffset;
                          
                          // Find closest character index in lyrics
                          let bestIdx = charMap.length;
                          let minDiff = 99999;

                          for (let k = 0; k < charMap.length; k++) {
                              const diff = Math.abs(charMap[k].x - chordX);
                              if (diff < minDiff) {
                                  minDiff = diff;
                                  bestIdx = k;
                              }
                          }

                          insertions.push({ index: bestIdx, text: `[${chord}]` });
                          localOffset += part.length * partWidth;
                      });
                  });

                  // 3. Construct Merged Line
                  // Sort insertions descending index to prevent drift
                  insertions.sort((a, b) => b.index - a.index);
                  
                  // Rebuild string
                  let mergedLine = charMap.map(c => c.char).join('');
                  insertions.forEach(ins => {
                      if (ins.index >= mergedLine.length) mergedLine += ins.text;
                      else mergedLine = mergedLine.slice(0, ins.index) + ins.text + mergedLine.slice(ins.index);
                  });

                  output.push(mergedLine);
                  i++; // Skip lyric row as it's merged
              } 
              else {
                  // Orphan Chord Line (Intro/Outro)
                  // Just wrap chords in brackets
                  const wrapped = row.items.map(i => {
                      return i.str.split(/\s+/).map(token => {
                          if (CHORD_TOKEN_REGEX.test(token)) return `[${token}]`;
                          return token;
                      }).join(' ');
                  }).join(' ');
                  output.push(wrapped);
              }
          } else if (row.type === 'lyric') {
              output.push(row.text);
          }
      }

      return {
          text: output.join('\n'),
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
              
              // Grid Engine Execution
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
                            <Layout className="w-5 h-5 text-primary" /> Grid-Based PDF Importer v3.0
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Exact layout reconstruction with visual overlay merging.</p>
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
                        <p className="text-xs text-slate-500 mt-2">Optimized for: Ultimate Guitar PDFs, ChordTela, and Standard Chord Sheets</p>
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
                                        
                                        {file.errorMsg && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Ban className="w-3 h-3"/> {file.errorMsg}</p>}
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
                                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">ChordPro Reconstruction:</p>
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
                            {isProcessing ? 'Processing...' : 'Start Reconstruction'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    </AnimatePresence>
  );
};
