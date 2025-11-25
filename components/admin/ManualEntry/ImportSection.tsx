import React, { useRef } from 'react';
import { FileText, Link as LinkIcon, Loader2, Download, Lock, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ImportSectionProps {
    isProcessingFile: boolean;
    isScraping: boolean;
    urlInput: string;
    importStatus: { type: 'success' | 'error', msg: string } | null;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlChange: (val: string) => void;
    onUrlScrape: (e: React.MouseEvent) => void;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
    isProcessingFile,
    isScraping,
    urlInput,
    importStatus,
    onFileSelect,
    onUrlChange,
    onUrlScrape
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <Globe className="w-4 h-4" /> Import Source
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-900/30">
                    <Lock className="w-3 h-3" />
                    Smart Layout Engine Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File Upload */}
                <div className="space-y-3 border-r border-slate-200 dark:border-white/5 md:pr-8">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <FileText className="w-3 h-3" /> From File (PDF / Word / Txt)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".txt,.docx,.pdf"
                                onChange={onFileSelect}
                                className="hidden"
                                id="chord-file-import"
                            />
                            <label
                                htmlFor="chord-file-import"
                                className={cn(
                                    "flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors",
                                    isProcessingFile && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {isProcessingFile ? "Extracting Spatial Data..." : "Select PDF, DOCX, or TXT..."}
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingFile}
                            type="button"
                            className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            {isProcessingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400">PDFs are analyzed geometrically to preserve Chord-over-Lyric positioning.</p>
                </div>

                {/* URL Scrape */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> From URL (ChordTela / UG)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => onUrlChange(e.target.value)}
                                placeholder="https://www.chordtela.com/..."
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <button
                            onClick={onUrlScrape}
                            type="button"
                            disabled={isScraping || !urlInput}
                            className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center"
                        >
                            {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Fetch
                        </button>
                    </div>
                </div>
            </div>

            {importStatus && (
                <div className={cn(
                    "mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2",
                    importStatus.type === 'success' ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                    {importStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {importStatus.msg}
                </div>
            )}
        </div>
    );
};
