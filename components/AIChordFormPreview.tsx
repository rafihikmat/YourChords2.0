import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye } from 'lucide-react';
import SongLyricsDisplay from './SongLyricsDisplay';

interface AIChordFormPreviewProps {
    generatedResult: {
        title: string;
        artist: string;
        chords: any;
    };
    html: string;
    onEdit: () => void;
    onReset: () => void;
}

const AIChordFormPreview: React.FC<AIChordFormPreviewProps> = ({
    generatedResult,
    html,
    onEdit,
    onReset
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/20 shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{generatedResult.title}</h2>
                        <p className="text-primary font-medium">{generatedResult.artist}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={onReset}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> New Song
                        </button>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20 px-6 py-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span><strong>Preview Mode:</strong> This song is available for your session only and has not been saved to the public library.</span>
                </div>

                {/* Content */}
                <div className="p-8 bg-white dark:bg-[#0A0F1C] min-h-[400px]">
                    <SongLyricsDisplay html={html} />
                </div>
            </div>
        </motion.div>
    );
};

export default AIChordFormPreview;
