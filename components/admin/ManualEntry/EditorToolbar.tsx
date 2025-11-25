import React from 'react';
import { Music, Wand2, RefreshCw } from 'lucide-react';

interface EditorToolbarProps {
    onAutoConvert: () => void;
    onRefresh: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAutoConvert, onRefresh }) => {
    return (
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-t-xl border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 px-2">
                <Music className="w-4 h-4" /> Chords & Lyrics Editor
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onAutoConvert}
                    className="flex items-center gap-1.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-900/30"
                    title="Fixes layout if chords are visually placed above lyrics"
                >
                    <Wand2 className="w-3 h-3" /> Fix Layout / Convert Visual Chords
                </button>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors"
                    title="Refresh / Convert to ChordPro"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};
