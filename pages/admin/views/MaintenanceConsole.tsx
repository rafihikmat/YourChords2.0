
import React, { useState } from 'react';
import { HardDrive, Layers } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';

const MaintenanceConsole: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleOrphanCleanup = async () => {
        if (!confirm("This will delete files from storage that are not linked to any song in the database. Continue?")) return;
        setLoading(true);
        setStatus('Scanning for orphaned files...');
        try {
            // 1. Get all songs with file_path
            const { data: songs } = await supabase.from('songs').select('file_path');
            const activeFiles = new Set(songs?.map((s: any) => s.file_path).filter(Boolean));

            // 2. List all files in storage
            const { data: files, error } = await supabase.storage.from('song-files').list();
            
            if (error) throw error;

            if (files) {
                const orphans = files.filter(f => f.name !== '.emptyFolderPlaceholder' && !activeFiles.has(f.name));
                if (orphans.length > 0) {
                    setStatus(`Found ${orphans.length} orphaned files. Deleting...`);
                    const pathsToRemove = orphans.map(o => o.name);
                    await supabase.storage.from('song-files').remove(pathsToRemove);
                    setStatus(`Successfully deleted ${orphans.length} orphaned files.`);
                } else {
                    setStatus('System Clean. No orphaned files found.');
                }
            }
        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
        setLoading(false);
    };

    const handleAutoAlbum = async () => {
        if (!confirm("This will group songs by artist and create albums automatically. Continue?")) return;
        setLoading(true);
        setStatus('Analyzing song database for album clusters...');
        try {
             // 1. Fetch all songs
             const { data: songs } = await supabase.from('songs').select('id, artist, album_id');
             if (!songs) throw new Error("No songs found");

             // 2. Group by Artist
             const artistMap: Record<string, Song[]> = {};
             songs.forEach((s: any) => {
                 // Normalize artist name to avoid case sensitivity issues
                 const key = s.artist.trim();
                 if (!artistMap[key]) artistMap[key] = [];
                 artistMap[key].push(s);
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

                         if (newAlbum) {
                             // Update Songs to link to new album
                             const songIds = artistSongs.map(s => s.id);
                             await supabase.from('songs').update({ album_id: newAlbum.id }).in('id', songIds);
                             albumsCreated++;
                         }
                     }
                 }
             }
             setStatus(`Maintenance Complete: Created ${albumsCreated} new albums from existing artist clusters.`);

        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Maintenance</h1>
                <p className="text-slate-500">Database optimization and storage cleanup tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Storage Cleaner */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-orange-500">
                        <HardDrive className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Storage Garbage Collector</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Scans the 'song-files' bucket for files that are no longer linked to any song in the database and permanently deletes them.
                    </p>
                    <button 
                        onClick={handleOrphanCleanup}
                        disabled={loading}
                        className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Run Cleanup
                    </button>
                </div>

                {/* Auto Album */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <Layers className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Smart Album Clustering</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Analyzes the song database. If an artist has multiple songs (&gt;1), this tool automatically creates an album and links them.
                    </p>
                    <button 
                         onClick={handleAutoAlbum}
                         disabled={loading}
                         className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Generate Albums
                    </button>
                </div>
            </div>

            {/* Console Output */}
            <div className="mt-8 bg-black rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto border border-white/10 shadow-inner">
                <div className="mb-2 opacity-50">admin@yourchords:~$ ready...</div>
                {loading && <div className="mb-2 animate-pulse text-yellow-400">Processing...</div>}
                {status && <div className="mb-2">{status}</div>}
            </div>
        </div>
    );
};

export default MaintenanceConsole;
