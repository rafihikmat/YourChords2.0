import React from 'react';
import { Mic2, Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMetronome } from '../../lib/hooks';

const MetronomeTool: React.FC = () => {
    const { isPlaying, setIsPlaying, bpm, setBpm } = useMetronome(120);

    return (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-12 shadow-xl text-center">
            <h2 className="text-2xl font-bold dark:text-white mb-8">
                <Mic2 className="w-6 h-6 text-primary inline mr-2" /> Metronome
            </h2>
            <div className="mb-10">
                <div className="text-6xl font-black dark:text-white mb-2 font-mono">{bpm}</div>
                <div className="text-slate-500 text-sm">BPM</div>
            </div>
            <input 
                type="range" 
                min="40" 
                max="240" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))} 
                className="w-64 accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mb-10" 
            />
            <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-xl mx-auto transition-all", 
                    isPlaying 
                        ? "bg-primary text-white animate-pulse" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                )}
            >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
        </div>
    );
};

export default MetronomeTool;
