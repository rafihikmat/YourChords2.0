
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Loader2, Disc3, Music, Eye, ChevronDown, Layout, Ban, Cpu, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

// Dynamically resolve worker version
const pdfjsVersion = pdfjsLib.version || '4.0.379';
// Use CDNJS for reliable worker loading
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessedFile {
  id: string;
  fileName: string;
  status: 'pending' | 'rendering' | 'analyzing' | 'saving' | 'done' | 'error';
  detectedTitle?: string;
  detectedArtist?: string;
  albumAction?: 'created' | 'linked' | 'none';
  errorMsg?: string;
  previewText?: string; 
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

  // --- TEXT ENGINE: EXTRACT TEXT WITH LAYOUT PRESERVATION ---
  const extractTextFromPDF = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullRawText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];

          if (items.length === 0) continue;

          // Group items by Y coordinate (lines)
          // Tolerance of 5 units handles slight misalignments in PDF generation
          const lines: { y: number, items: any[] }[] = [];
          
          items.forEach(item => {
              const y = item.transform[5]; // Y coordinate
              // Find existing line within tolerance
              const existingLine = lines.find(l => Math.abs(l.y - y) < 5);
              if (existingLine) {
                  existingLine.items.push(item);
              } else {
                  lines.push({ y, items: [item] });
              }
          });

          // Sort lines Top-to-Bottom (PDF Y is usually 0 at bottom, so descending)
          lines.sort((a, b) => b.y - a.y);

          // Construct text page
          let pageText = "";
          lines.forEach(line => {
              // Sort items Left-to-Right within line
              line.items.sort((a, b) => a.transform[4] - b.transform[4]);
              // Join with spaces (simple logic, can be improved with X-distance calc)
              const lineStr = line.items.map(item => item.str).join(' ');
              pageText += lineStr + "\n";
          });

          fullRawText += pageText + "\n\n";
      }
      return fullRawText;
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
              updateStatus({ status: 'rendering' });
              
              // 1. Extract Raw Text directly (No Vision API needed, much lighter)
              const extractedText = await extractTextFromPDF(file);
              
              if (!extractedText || extractedText.length < 50) {
                  throw new Error("PDF appears to be empty or scanned image. Text mode requires selectable text.");
              }

              updateStatus({ status: 'analyzing' });

              // 2. Send Text to Gemini via Edge Function
              const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-chords', {
                  body: {
                      text: extractedText,
                      mode: 'text_extraction' // New lightweight mode
                  }
              });

              if (aiError) {
                  console.error("Supabase Function Error:", aiError);
                  throw new Error(aiError.message || "AI Processing Error");
              }
              
              if (aiData.error) throw new Error(aiData.error);

              const { title, artist, chords } = aiData;
              
              // Convert structured chords back to text preview if needed
              const previewText = Array.isArray(chords) 
                ? chords.map((line: any) => {
                    const c = line.chords ? line.chords.map((x: string) => `[${x}]`).join('') : '';
                    return `${c}${line.line}`;
                  }).join('\n')
                : "No content parsed";

              updateStatus({ detectedTitle: title, detectedArtist: artist, previewText });

              // 3. Save to Database
              updateStatus({ status: 'saving' });
              
              const { id: albumId, action } = await ensureAlbum(artist);
              
              const { error: dbError } = await supabase.from('songs').insert([{
                  title: title || file.name.replace('.pdf', ''),
                  artist: artist || 'Unknown Artist',
                  difficulty: aiData.difficulty || 'Medium', 
                  album_id: albumId || null,
                  chords: chords, // Save the structured JSON directly
                  view_count: 0
              }]);

              if (dbError) throw dbError;
              updateStatus({ status: 'done', albumAction: action });

          } catch (err: any) {
              console.error(err);
              updateStatus({ status: 'error', errorMsg: err.message || "Processing Failed" });
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
                            <FileText className="w-5 h-5 text-primary" /> Text-Based PDF Import
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Fast extraction for text-based PDFs (Ultimate Guitar, etc).</p>
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
                        "p-8 border-2 border-dashed transition-all m-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden",
                        isDragActive 
                            ? "border-primary bg-primary/10" 
                            : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-slate-50 dark:bg-black/20"
                    )}
                >
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                <span className="text-xs font-bold text-primary animate-pulse">ANALYZING TEXT STREAMS</span>
                            </div>
                        </div>
                    )}
                    <input type="file" multiple accept=".pdf" onChange={handleFileInput} className="hidden" id="bulk-file-input" disabled={isProcessing} />
                    <label htmlFor="bulk-file-input" className="cursor-pointer flex flex-col items-center w-full h-full">
                        <Upload className={cn("w-10 h-10 mb-3 transition-colors", isDragActive ? "text-primary" : "text-slate-400")} />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {isDragActive ? "Drop PDF files now" : "Click to upload or drag PDFs here"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Instant conversion using Neural Text Analysis</p>
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
                                        <FileText className="w-4 h-4 text-blue-500" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.fileName}>{file.fileName}</p>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1",
                                                file.status === 'pending' && "bg-slate-200 text-slate-600",
                                                file.status === 'rendering' && "bg-blue-100 text-blue-600",
                                                file.status === 'analyzing' && "bg-purple-100 text-purple-600",
                                                file.status === 'saving' && "bg-yellow-100 text-yellow-600",
                                                file.status === 'done' && "bg-green-100 text-green-600",
                                                file.status === 'error' && "bg-red-100 text-red-600"
                                            )}>
                                                {file.status === 'rendering' && <Loader2 className="w-3 h-3 animate-spin"/>}
                                                {file.status === 'analyzing' && <Cpu className="w-3 h-3 animate-pulse"/>}
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
                                            title="View Extracted Result"
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
                                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">AI Reconstruction:</p>
                                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-white/5 max-h-40 overflow-y-auto leading-relaxed">
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
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isProcessing ? 'Analyzing...' : 'Start Import'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    </AnimatePresence>
  );
};
