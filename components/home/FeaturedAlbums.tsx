import React from 'react';
import { Disc, Music2 } from 'lucide-react';
import { Album } from '../../types';

interface FeaturedAlbumsProps {
    albums: Album[];
}

export const FeaturedAlbums: React.FC<FeaturedAlbumsProps> = ({ albums }) => {
    return (
        <div className="relative z-10 px-6 py-16 bg-slate-100 dark:bg-slate-900/50 w-full border-y border-slate-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <Disc className="w-5 h-5 text-primary" /> Featured Albums
                </h3>
                {albums.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {albums.map(album => (
                            <div key={album.id} className="group cursor-pointer">
                                <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-3 shadow-lg border border-slate-200 dark:border-white/10 relative">
                                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Music2 className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{album.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{album.artist}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 text-sm italic">
                        No albums curated yet.
                    </div>
                )}
            </div>
        </div>
    );
};
