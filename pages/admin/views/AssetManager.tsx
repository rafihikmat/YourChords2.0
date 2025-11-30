
import React, { useState } from 'react';
import { PlayCircle, Disc3, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AlbumManager } from './assets/AlbumManager';
import { VideoManager } from './assets/VideoManager';

const AssetManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="p-8 animate-in fade-in duration-500">
             {/* Header Section */}
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Assets</h1>
                    <p className="text-slate-500 mt-1">Manage multimedia resources.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
                    {/* Shared Search Input */}
                    <div className="relative flex-1 sm:w-64 w-full">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Search assets..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 text-sm outline-none focus:ring-2 focus:ring-primary/50 w-full text-slate-900 dark:text-white placeholder-slate-500 transition-all" 
                        />
                    </div>
                    
                    {/* Tab Switcher */}
                    <div className="flex bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 shrink-0 w-full sm:w-auto">
                        <button 
                            onClick={() => setActiveTab('albums')}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                                activeTab === 'albums' 
                                    ? "bg-slate-100 dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                            )}
                        >
                            <Disc3 className="w-4 h-4" /> Albums
                        </button>
                        <button 
                            onClick={() => setActiveTab('videos')}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                                activeTab === 'videos' 
                                    ? "bg-slate-100 dark:bg-slate-800 shadow-sm text-primary dark:text-white scale-105" 
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                            )}
                        >
                            <PlayCircle className="w-4 h-4" /> Videos
                        </button>
                    </div>
                </div>
             </div>

             {/* Render active sub-manager */}
             <div className="min-h-[500px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
                 {activeTab === 'albums' ? (
                     <AlbumManager searchTerm={searchTerm} />
                 ) : (
                     <VideoManager searchTerm={searchTerm} />
                 )}
             </div>
        </div>
    );
};

export default AssetManager;
