import React from 'react';
import { Zap, Loader2, Database, AlertTriangle, SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';
import SongCard from '../ui/SongCard';
import { Song } from '../../types';

interface TrendingSectionProps {
    songs: Song[];
    isLoading: boolean;
    fetchError: string | null;
    difficultyFilter: string;
    setDifficultyFilter: (filter: string) => void;
    handleSeed: () => void;
    isSeeding: boolean;
    filteredSongs: Song[];
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
    songs,
    isLoading,
    fetchError,
    difficultyFilter,
    setDifficultyFilter,
    handleSeed,
    isSeeding,
    filteredSongs
}) => {
    return (
        <div id="library-section" className="relative z-10 px-6 pb-20 max-w-7xl mx-auto w-full scroll-mt-24">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" /> Trending Now
                    </h3>
                    {!isLoading && songs.length === 0 && (
                        <button 
                            onClick={handleSeed} 
                            disabled={isSeeding}
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors"
                        >
                            {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                            {isSeeding ? 'Seeding...' : 'Seed Data'}
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-lg w-full md:w-auto">
                    {['All', 'Easy', 'Medium', 'Hard', 'Expert'].map((level) => (
                        <button
                            key={level}
                            onClick={() => setDifficultyFilter(level)}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-medium transition-all flex-1 md:flex-none text-center",
                                difficultyFilter === level
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[300px]">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="h-48 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse"></div>
                    ))
                ) : fetchError ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-900/20">
                        <AlertTriangle className="w-12 h-12 mb-4 opacity-80" />
                        <p className="font-bold mb-2">Database Connection Error</p>
                        <p className="text-sm opacity-80 mb-4">{fetchError}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Did you run the SQL setup script?</p>
                    </div>
                ) : filteredSongs.length > 0 ? (
                    filteredSongs.slice(0, 6).map(song => (
                        <SongCard key={song.id} song={song} />
                    ))
                ) : (
                    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                        <SearchX className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No songs found in the database.</p>
                        <p className="text-sm opacity-70 mb-6">Your library is empty. Initialize it with demo content.</p>
                        
                        <button 
                            onClick={handleSeed} 
                            disabled={isSeeding}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            {isSeeding ? "Seeding Database..." : "Initialize Demo Data"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
