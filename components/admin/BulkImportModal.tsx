
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, FileType } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { convertToChordPro, parseChordsFromText } from '../../lib/musicUtils';
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
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
        // Initialize results state for these files
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
          const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
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

  // --- PDF LOGIC ---
  const extractTextFromPdf = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Only read first 3 pages max to save time, usually enough for tabs
      const maxPages = Math.min(pdf.numPages, 3);
      
      for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Sort items by Y position (descending) then X position (ascending)
          // PDF coordinates: (0,0) is bottom-left usually, but items.transform[5] is Y
          const items = textContent.items as any[];
          items.sort((a, b) => {
              const yDiff = b.transform[5] - a.transform[5];
              if (Math.abs(yDiff) > 5) return yDiff; // Significant line difference
              return a.transform[4] - b.transform[4]; // X diff
          });

          // Better Reconstruction Strategy
          let lastY = -1;
          let textPage = '';
          for (const item of items) {
              if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 10) {
                  textPage += '\n';
              }
              textPage += item.str; 
              lastY = item.transform[5];
          }
          
          fullText += textPage + '\n\n';
      }
      return fullText;
  };

  const parseMetadata = (text: string, fileName: string) => {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let title = fileName.replace('.pdf', '');
      let artist = 'Unknown Artist';
      
      // Heuristics:
      // 1. Look for "by [Artist]"
      // 2. Look for "Artist: [Name]"
      // 3. Assume Line 1 = Title, Line 2 = Artist if mostly text
      
      // Try to find explicit "by"
      const byLineIndex = lines.findIndex(l => /^(by|artist:)\s+/i.test(l));
      
      if (byLineIndex !== -1) {
          artist = lines[byLineIndex].replace(/^(by|artist:)\s+/i, '').trim();
          // Assuming title is above
          if (byLineIndex > 0) {
              title = lines[byLineIndex - 1];
          }
      } else {
          // Fallback: Line 1 Title, Line 2 Artist (if not chord line)
          if (lines.length > 0) title = lines[0];
          if (lines.length > 1 && lines[1].length < 50) artist = lines[1];
      }

      // Cleanup
      title = title.replace(/tabs?|chords?|lyrics?/gi, '').trim();
      
      return { title, artist };
  };

  // --- ALBUM CLUSTERING LOGIC (FIXED WITH TYPES) ---
  const ensureAlbum = async (artistName: string): Promise<{ id: string, action: 'created' | 'linked' | 'none' }> => {
      if (!artistName || artistName === 'Unknown Artist') return { id: '', action: 'none' };

      const normalized = artistName.toLowerCase().trim();
      
      // 1. Search existing - USING TYPE ASSERTION
      // .select() returns T[] | null. We cast it to AlbumRow[].
      const { data: existingData } = await supabase
        .from('albums')
        .select('id, artist')
        .ilike('artist', normalized)
        .limit(1);

      // Safely check length
      if (existingData && existingData.length > 0) {
          // Cast the first element
          const existingAlbum = existingData[0] as unknown as AlbumRow;
          return { id: existingAlbum.id, action: 'linked' };
      }

      // 2. Create new - USING TYPE ASSERTION
      const { data: newAlbumData, error } = await supabase
        .from('albums')
        .insert([{
            title: `${artistName} Collection`,
            artist: artistName,
            cover_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=random&size=512`
        }])
        .select()
        .single();

      if (error || !newAlbumData) throw new Error("Failed to create album");
      
      // Force type on the returned row
      const newAlbum = newAlbumData as unknown as AlbumRow;
      
      return { id: newAlbum.id, action: 'created' };
  };

  const processBatch = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const resultIndex = i; // Since files and results arrays align 1:1 initially
          
          const updateStatus = (s: Partial<ProcessedFile>) => {
              setResults(prev => {
                  const next = [...prev];
                  next[resultIndex] = { ...next[resultIndex], ...s };
                  return next;
              });
          };

          try {
              updateStatus({ status: 'parsing' });
              const rawText = await extractTextFromPdf(file);
              
              const { title, artist } = parseMetadata(rawText, file.name);
              updateStatus({ detectedTitle: title, detectedArtist: artist });

              // Convert to ChordPro
              const chordPro = convertToChordPro(rawText);
              const parsedChords = parseChordsFromText(chordPro); // For the chords column (legacy compatibility)

              updateStatus({ status: 'clustering' });
              const { id: albumId, action } = await ensureAlbum(artist);
              
              updateStatus({ status: 'saving', albumAction: action });
              
              const { error } = await supabase.from('songs').insert([{
                  title,
                  artist,
                  difficulty: 'Medium', // Default
                  album_id: albumId || null,
                  chords: parsedChords, // This saves {line, chords}[]
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
                            <FileType className="w-5 h-5 text-primary" /> Bulk PDF Import
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Drag & Drop multiple PDFs to auto-extract and categorize.</p>
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
                            {isDragActive ? "Drop files now" : "Click to upload or drag PDFs here"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Supports batch processing with Auto-Album clustering.</p>
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
