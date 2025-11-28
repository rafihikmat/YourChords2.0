
import React, { useState } from 'react';
import { HardDrive, Layers, Database } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song } from '../../../types';
import { seedDatabase } from '../../../lib/seeder';

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
                    setStatus(`Successfully deleted ${orphans.length} orphaned files.`);
                } else {
                    setStatus('System Clean. No orphaned files found.');
                }
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setStatus('Error: ' + e.message);
            } else {
                setStatus('An unknown error occurred.');
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
             setStatus(`Maintenance Complete: Created ${albumsCreated} new albums from existing artist clusters.`);

        } catch (e: unknown) {
             if (e instanceof Error) {
                setStatus('Error: ' + e.message);
            } else {
                setStatus('An unknown error occurred.');
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
            setStatus(`Seed Complete: ${res.success} songs added, ${res.failed} skipped/failed.`);
        } catch(e: unknown) {
            if (e instanceof Error) {
                setStatus('Error seeding: ' + e.message);
            } else {
                setStatus('An unknown error occurred.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="p-8 animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Maintenance</h1>
                <p className="text-slate-500">Database optimization and storage cleanup tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Storage Cleaner */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-orange-500">
                        <HardDrive className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Garbage Collector</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Deletes files in storage that are not linked to any song in the DB.
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
                        <h3 className="font-bold text-lg">Album Clustering</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Automatically creates albums for artists with multiple songs.
                    </p>
                    <button 
                         onClick={handleAutoAlbum}
                         disabled={loading}
                         className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Generate Albums
                    </button>
                </div>

                 {/* Seeder */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-green-500">
                        <Database className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Demo Data Seeder</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Populates the database with 10 popular songs (Coldplay, Dewa 19, etc).
                    </p>
                    <button 
                         onClick={handleSeed}
                         disabled={loading}
                         className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-green-500 hover:text-white dark:hover:bg-green-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Inject Demo Data
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
