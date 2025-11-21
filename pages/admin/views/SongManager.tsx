
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ExternalLink, Edit, Trash2, Disc3, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song, Album } from '../../../types';
import { cn, fuzzySearch, DIFFICULTY_COLORS } from '../../../lib/utils';

const SongManager: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: songData } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
        const { data: albumData } = await supabase.from('albums').select('*').order('title', { ascending: true });
        
        if (songData) setSongs(songData as unknown as Song[]);
        if (albumData) setAlbums(albumData as unknown as Album[]);
        setLoading(false);
    };

    const handleDelete = async (id: string, filePath?: string | null) => {
        if (confirm('WARNING: Are you sure you want to PERMANENTLY delete this song?')) {
            try {
                if (filePath) await supabase.storage.from('song-files').remove([filePath]);
                const { error } = await supabase.from('songs').delete().eq('id', id);
                if (error) throw error;
                setSongs(prev => prev.filter(s => s.id !== id));
            } catch (e: any) {
                alert("System Error: " + e.message);
            }
        }
    };
    
    const handleEdit = (song: Song) => {
        navigate('/admin/manual-entry', { state: { songToEdit: song } });
    };

    const handleAlbumAssign = async (songId: string, albumId: string) => {
        const val = albumId === 'none' ? null : albumId;
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, album_id: val || undefined } : s));
        const { error } = await supabase.from('songs').update({ album_id: val }).eq('id', songId);
        if (error) {
            alert("Failed to update album");
            fetchData();
        }
    };

    const filteredSongs = fuzzySearch<Song>(songs, searchTerm, ['title', 'artist']).filter(s => 
        difficultyFilter ? s.difficulty === difficultyFilter : true
    );

    return (
        <div className="p-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Song Registry</h1>
                    <p className="text-slate-500">Manage library content and metadata.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search library..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg bg-transparent border-none focus:ring-0 text-sm w-64 text-slate-900 dark:text-white placeholder-slate-500" />
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
                    <select className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer" value={difficultyFilter || ''} onChange={(e) => setDifficultyFilter(e.target.value || null)}>
                        <option value="">All Levels</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="p-4">Track Info</th>
                                <th className="p-4">Album Association</th>
                                <th className="p-4">Difficulty</th>
                                <th className="p-4 text-center">Stats</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500"><div className="animate-pulse">Syncing Database...</div></td></tr>
                            ) : filteredSongs.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No matching records found.</td></tr>
                            ) : (
                                filteredSongs.map(song => (
                                    <tr key={song.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{song.title}</div>
                                            <div className="text-xs text-slate-500">{song.artist}</div>
                                            {song.file_path && <span className="mt-1 inline-block text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">FILE</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Disc3 className={cn("w-4 h-4", song.album_id ? "text-primary" : "text-slate-300 dark:text-slate-700")} />
                                                <select value={song.album_id || 'none'} onChange={(e) => handleAlbumAssign(song.id, e.target.value)} className="bg-transparent text-xs border-none focus:ring-0 cursor-pointer max-w-[150px] truncate text-slate-600 dark:text-slate-300 hover:text-primary">
                                                    <option value="none">No Album</option>
                                                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", DIFFICULTY_COLORS[song.difficulty] || DIFFICULTY_COLORS['Medium'])}>{song.difficulty}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full"><Eye className="w-3 h-3" /> {song.view_count.toLocaleString()}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/song/${song.id}`} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded transition-colors"><ExternalLink className="w-4 h-4" /></Link>
                                                <button onClick={() => handleEdit(song)} className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(song.id, song.file_path)} className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SongManager;
