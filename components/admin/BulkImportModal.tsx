
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileJson, Check, AlertCircle, Loader2, Save, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Song } from '../../types';
import { cn } from '../../lib/utils';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportItem {
  title: string;
  artist: string;
  content: string; // Raw chord text or lyrics
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      if (!Array.isArray(json)) throw new Error("File must contain a JSON array.");
      
      const validItems: ImportItem[] = json.map((item: any) => ({
        title: item.title || "Unknown Title",
        artist: item.artist || "Unknown Artist",
        content: item.content || item.body || item.lyrics || "",
        status: 'pending' as const
      })).filter((i: any) => i.content.length > 0);

      setItems(validItems);
    } catch (e: any) {
      alert("Invalid JSON Format. Expected array of { title, artist, content }.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    
    const newItems = [...items];
    
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (item.status === 'success') continue;

      try {
        // Convert raw content to simplistic legacy format for compatibility if needed
        // Or store as raw text chords array
        const chords = item.content.split('\n').filter((l: string) => l.trim().length > 0);

        const { error } = await supabase.from('songs').insert({
          title: item.title,
          artist: item.artist,
          chords: chords,
          difficulty: 'Medium',
          view_count: 0
        });

        if (error) throw error;
        newItems[i] = { ...item, status: 'success' };
      } catch (e: any) {
        newItems[i] = { ...item, status: 'error', message: e.message };
      }
      
      // Update UI every item to show progress
      setItems([...newItems]);
    }

    setIsUploading(false);
    
    // Auto close if all success after 1s
    if (newItems.every(i => i.status === 'success')) {
        setTimeout(() => {
            onSuccess();
            onClose();
            setItems([]);
        }, 1000);
    }
  };

  const downloadTemplate = () => {
      const template = [
          {
              "title": "Example Song",
              "artist": "Example Artist",
              "content": "[Am]Hello [C]World\nThis is a new line"
          }
      ];
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "import_template.json";
      a.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-primary" /> Bulk Import
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Import multiple songs via JSON array.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">
                {items.length === 0 ? (
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                            isDragging ? "border-primary bg-primary/10" : "border-slate-300 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                        <Upload className={cn("w-12 h-12 mb-4", isDragging ? "text-primary" : "text-slate-400")} />
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">Drop JSON file here</h3>
                        <p className="text-sm text-slate-500 mt-2">or click to browse</p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                            className="mt-6 text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <FileText className="w-3 h-3" /> Download Template
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.title}</h4>
                                    <p className="text-xs text-slate-500 truncate">{item.artist}</p>
                                </div>
                                <div className="shrink-0">
                                    {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                                    {item.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                                    {item.status === 'error' && <span className="text-xs text-red-500 font-medium">{item.message || "Error"}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    {items.length > 0 ? `${items.length} songs ready` : 'No file selected'}
                </div>
                <div className="flex gap-2">
                    {items.length > 0 && (
                        <button 
                            onClick={() => setItems([])} 
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            disabled={isUploading}
                        >
                            Reset
                        </button>
                    )}
                    <button 
                        onClick={handleUpload}
                        disabled={items.length === 0 || isUploading}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isUploading ? 'Importing...' : 'Start Import'}
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
