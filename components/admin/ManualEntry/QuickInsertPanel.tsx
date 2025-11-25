import React from 'react';
import { Grid } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface QuickInsertPanelProps {
    selectedQuality: { label: string; suffix: string };
    onQualitySelect: (q: { label: string; suffix: string }) => void;
    onInsert: (root: string) => void;
}

const CHORD_QUALITIES = [
    { label: 'MAJOR', suffix: '' },
    { label: 'MINOR', suffix: 'm' },
    { label: '7TH', suffix: '7' },
    { label: 'MAJ7', suffix: 'maj7' },
    { label: 'MIN7', suffix: 'm7' },
    { label: 'SUS4', suffix: 'sus4' }
];

const ROOT_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const QuickInsertPanel: React.FC<QuickInsertPanelProps> = ({
    selectedQuality,
    onQualitySelect,
    onInsert
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
            <div className="flex items-center gap-4 mb-4">
                <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2 shrink-0"><Grid className="w-4 h-4 text-primary" /> Quick Insert Chords</h3>

                {/* Quality Tabs */}
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {CHORD_QUALITIES.map(q => (
                        <button
                            type="button"
                            key={q.label}
                            onClick={() => onQualitySelect(q)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                                selectedQuality.label === q.label
                                    ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
                            )}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Root Note Buttons Grid */}
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {ROOT_NOTES.map(note => (
                    <button
                        type="button"
                        key={note}
                        onClick={() => onInsert(note)}
                        className="flex-1 min-w-[48px] bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-slate-700 dark:text-slate-200 text-sm font-bold py-3 rounded-lg border border-slate-200 dark:border-white/5 transition-all active:scale-95 shadow-sm"
                    >
                        {note}
                    </button>
                ))}
            </div>
        </div>
    );
};
