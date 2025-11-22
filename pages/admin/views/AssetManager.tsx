
import React, { useState } from 'react';
import { PlayCircle, Disc3 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AlbumManager } from './assets/AlbumManager';
import { VideoManager } from './assets/VideoManager';

const AssetManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="p-8 animate-in fade-in">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Assets</h1>
                    <p className="text-slate-500">Manage multimedia resources.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Shared Search Input */}
                    <input 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-48" 
                    />
                    
                    {/* Tab Switcher */}
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-transparent shrink-0">
                        <button 
                            onClick={() => setActiveTab('albums')}
                            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2", activeTab === 'albums' ? "bg-slate-100 dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500")}
                        >
                            <Disc3 className="w-4 h-4" /> Albums
                        </button>
                        <button 
                            onClick={() => setActiveTab('videos')}
                            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2", activeTab === 'videos' ? "bg-slate-100 dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500")}
                        >
                            <PlayCircle className="w-4 h-4" /> Videos
                        </button>
                    </div>
                </div>
             </div>

             {/* Render active sub-manager */}
             <div className="min-h-[500px]">
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
