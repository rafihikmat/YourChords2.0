import React, { useState } from 'react';
import { HardDrive, Layers, Database, Terminal, Play, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { seedDatabase } from '../../../lib/seeder';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../contexts/ToastContext';

const MaintenanceConsole: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();

    const handleOrphanCleanup = async () => {
        if (!confirm("This will delete files from storage that are not linked to any song in the database. Continue?")) return;
        setLoading(true);
        setStatus('Scanning for orphaned files...');
        try {
            // 1. Get all songs with file_path
            const { data: songs } = await supabase.from('songs').select('file_path');
            const activeFiles = new Set(songs?.map((s: { file_path: string }) => s.file_path).filter(Boolean));

            // 2. List all files in storage
            const { data: files, error } = await supabase.storage.from('song-files').list();
            
            if (error) throw error;

            if (files) {
                const orphans = files.filter(f => f.name !== '.emptyFolderPlaceholder' && !activeFiles.has(f.name));
                if (orphans.length > 0) {
                    setStatus(`Found ${orphans.length} orphaned files. Deleting...`);
                    const pathsToRemove = orphans.map(o => o.name);
                    await supabase.storage.from('song-files').remove(pathsToRemove);
                    const msg = `Successfully deleted ${orphans.length} orphaned files.`;
                    setStatus(msg);
                    success(msg);
                } else {
                    const msg = 'System Clean. No orphaned files found.';
                    setStatus(msg);
                    success(msg);
                }
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setStatus('Error: ' + e.message);
                toastError(e.message);
            } else {
                setStatus('An unknown error occurred.');
                toastError('Unknown error');
            }
        }
        setLoading(false);
    };

    const handleAutoAlbum = async () => {
        if (!confirm("This will group songs by artist and create albums automatically. Continue?")) return;
        setLoading(true);
        setStatus('Analyzing song database for album clusters...');
        try {
             // 1. Fetch all songs
             const { data: rawSongs } = await supabase.from('songs').select('id, artist, album_id');
             if (!rawSongs) throw new Error("No songs found");
             
             const songs = rawSongs as unknown as Song[];

             // 2. Group by Artist
             const artistMap: Record<string, Song[]> = {};
             songs.forEach((song) => {
                 // Normalize artist name to avoid case sensitivity issues
                 const key = song.artist.trim();
                 if (!artistMap[key]) artistMap[key] = [];
                 artistMap[key].push(song);
             });

             let albumsCreated = 0;

             // 3. Check groups
             for (const artist in artistMap) {
                 const artistSongs = artistMap[artist];
                 
                 // Only process if artist has > 1 song
                 if (artistSongs.length > 1) {
                     // Check if ANY of the songs already belong to an album
                     const hasAlbum = artistSongs.some(s => s.album_id);
                     
                     if (!hasAlbum) {
                         // Create Album
                         const albumTitle = `${artist} Essentials`;
                         const { data: newAlbum, error: albumError } = await supabase.from('albums').insert([{
                             title: albumTitle,
                             artist: artist,
                             cover_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(albumTitle)}&background=random&size=512`
                         }]).select().single();

                          
                         if (albumError) {
                            console.error('Error creating album:', albumError);
                         }

                         if (newAlbum) {
                             // Update Songs to link to new album
                             const songIds = artistSongs.map(s => s.id);
                             await supabase.from('songs').update({ album_id: newAlbum.id }).in('id', songIds);
                             albumsCreated++;
                         }
                     }
                 }
             }
             const msg = `Maintenance Complete: Created ${albumsCreated} new albums from existing artist clusters.`;
             setStatus(msg);
             success(msg);

        } catch (e: unknown) {
             if (e instanceof Error) {
                setStatus('Error: ' + e.message);
                toastError(e.message);
            } else {
                setStatus('An unknown error occurred.');
                toastError('Unknown error');
            }
        }
        setLoading(false);
    };

    const handleSeed = async () => {
        if(!confirm("This will insert 10 sample songs into the database. Continue?")) return;
        setLoading(true);
        setStatus('Seeding database with demo content...');
        try {
            const res = await seedDatabase();
            const msg = `Seed Complete: ${res.success} songs added, ${res.failed} skipped/failed.`;
            setStatus(msg);
            success(msg);
        } catch(e: unknown) {
            if (e instanceof Error) {
                setStatus('Error seeding: ' + e.message);
                toastError(e.message);
            } else {
                setStatus('An unknown error occurred.');
                toastError('Unknown error');
            }
        }
        setLoading(false);
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Maintenance</h1>
                <p className="text-slate-500 mt-1">Database optimization and storage cleanup tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Storage Cleaner */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-4 text-orange-500">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Garbage Collector</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                        Deletes files in storage that are not linked to any song in the DB.
                    </p>
                    <button 
                        onClick={handleOrphanCleanup}
                        disabled={loading}
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run Cleanup
                    </button>
                </div>

                {/* Auto Album */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Album Clustering</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                        Automatically creates albums for artists with multiple songs.
                    </p>
                    <button 
                         onClick={handleAutoAlbum}
                         disabled={loading}
                         className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Generate Albums
                    </button>
                </div>

                 {/* Seeder */}
                 <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-4 text-green-500">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Database className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Demo Data Seeder</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                        Populates the database with 10 popular songs (Coldplay, Dewa 19, etc).
                    </p>
                    <button 
                         onClick={handleSeed}
                         disabled={loading}
                         className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-lg shadow-green-500/20 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Inject Demo Data
                    </button>
                </div>
            </div>

            {/* Console Output */}
            <div className="bg-slate-950 rounded-2xl p-6 font-mono text-xs text-green-400 h-64 overflow-y-auto border border-slate-800 shadow-2xl relative group">
                <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Terminal className="w-5 h-5 text-slate-600" />
                </div>
                <div className="mb-2 opacity-50 select-none">admin@yourchords:~$ ready...</div>
                {loading && (
                    <div className="mb-2 flex items-center gap-2 text-yellow-400 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Processing request...
                    </div>
                )}
                {status && (
                    <div className="flex items-start gap-2 animate-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-500 mt-0.5">{'>'}</span>
                        <span className={cn(
                            "break-all",
                            status.startsWith('Error') ? "text-red-400" : "text-green-400"
                        )}>
                            {status}
                        </span>
                    </div>
                )}
                <div className="w-2 h-4 bg-green-500/50 animate-pulse mt-2 inline-block" />
            </div>
        </div>
    );
};

export default MaintenanceConsole;
