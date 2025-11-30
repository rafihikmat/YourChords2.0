import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTuner } from '../../lib/hooks/useTuner';

const GUITAR_STRINGS = [
    { note: 'E2', freq: 82.41 }, { note: 'A2', freq: 110.00 }, { note: 'D3', freq: 146.83 },
    { note: 'G3', freq: 196.00 }, { note: 'B3', freq: 246.94 }, { note: 'E4', freq: 329.63 },
];

const TunerTool: React.FC = () => {
    const { activeNote, playNote } = useTuner();

    return (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl text-center">
            <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center justify-center gap-2">
                <Activity className="w-6 h-6 text-primary" /> Standard Tuning
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {GUITAR_STRINGS.map((s) => (
                    <button 
                        key={s.note} 
                        onClick={() => playNote(s.freq, s.note)} 
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 relative overflow-hidden", 
                            activeNote === s.note 
                                ? "bg-primary text-white border-primary" 
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10"
                        )}
                    >
                        <span className="text-2xl font-black mb-2">{s.note.charAt(0)}</span>
                        <span className="text-xs opacity-70">{s.freq}Hz</span>
                        {activeNote === s.note && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TunerTool;
