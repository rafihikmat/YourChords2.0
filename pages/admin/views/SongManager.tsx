import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Edit, Trash2, Disc3, Eye, Upload, Plus, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Song, Album } from '../../../types';
import { cn, DIFFICULTY_COLORS } from '../../../lib/utils';
import { useToast } from '../../../contexts/ToastContext';
import { SearchFilterBar } from '../../../components/admin/SearchFilterBar';
import { BulkImportModal } from '../../../components/admin/BulkImportModal';

const ITEMS_PER_PAGE = 20;

const SongManager: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('');
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const navigate = useNavigate();
    const { toast, success, error: toastError } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Build Query
            let query = supabase
                .from('songs')
                .select('*', { count: 'exact' });

            // 2. Apply Filters
            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
            }
            if (difficultyFilter) {
                query = query.eq('difficulty', difficultyFilter);
            }

            // 3. Apply Pagination
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setSongs(data as unknown as Song[]);
            setTotalCount(count || 0);

            // Fetch Albums (only once ideally, but lightweight enough)
            const { data: albumData } = await supabase.from('albums').select('*').order('title', { ascending: true });
            if (albumData) setAlbums(albumData as unknown as Album[]);

        } catch (err: any) {
            toastError(err.message || 'Failed to fetch songs');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, difficultyFilter, toastError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, difficultyFilter]);

    const handleDelete = async (id: string, filePath?: string | null) => {
        if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete this song?')) return;
        
        try {
            if (filePath) await supabase.storage.from('song-files').remove([filePath]);
            const { error } = await supabase.from('songs').delete().eq('id', id);
            if (error) throw error;
            
            success('Song deleted successfully');
            fetchData(); // Refresh list
        } catch (e: any) {
            toastError("System Error: " + (e.message || "Unknown error"));
        }
    };
    
    const handleEdit = (song: Song) => {
        navigate('/admin/manual-entry', { state: { songToEdit: song } });
    };

    const handleAlbumAssign = async (songId: string, albumId: string) => {
        const val = albumId === 'none' ? null : albumId;
        // Optimistic update
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, album_id: val || undefined } : s));
        
        const { error } = await supabase.from('songs').update({ album_id: val }).eq('id', songId);
        if (error) {
            toastError("Failed to update album");
            fetchData(); // Revert on error
        } else {
            toast('success', 'Album updated', 2000);
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="p-8 animate-in fade-in duration-500 relative">
            <BulkImportModal 
                isOpen={isImportOpen} 
                onClose={() => setIsImportOpen(false)} 
                onSuccess={() => { success('Import successful'); fetchData(); }} 
            />

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Song Registry</h1>
                    <p className="text-slate-500 mt-1">Manage library content and metadata.</p>
                </div>
                
                <SearchFilterBar 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Search title or artist..."
                    filters={[
                        {
                            value: difficultyFilter,
                            onChange: setDifficultyFilter,
                            options: [
                                { label: 'All Levels', value: '' },
                                { label: 'Easy', value: 'Easy' },
                                { label: 'Medium', value: 'Medium' },
                                { label: 'Hard', value: 'Hard' },
                                { label: 'Expert', value: 'Expert' },
                            ]
                        }
                    ]}
                    actions={
                        <>
                            <button 
                                onClick={() => setIsImportOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-bold rounded-xl transition-all duration-300 border border-slate-200/60 dark:border-white/5 hover:scale-105 active:scale-95"
                            >
                                <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Bulk Import</span>
                            </button>
                            <button 
                                onClick={() => navigate('/admin/manual-entry')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/25 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Add Song
                            </button>
                        </>
                    }
                />
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-black/20 flex flex-col min-h-[600px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200/60 dark:border-white/5">
                            <tr>
                                <th className="p-5 pl-6">Track Info</th>
                                <th className="p-5">Album Association</th>
                                <th className="p-5">Difficulty</th>
                                <th className="p-5 text-center">Stats</th>
                                <th className="p-5 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500"><div className="animate-pulse flex flex-col items-center gap-2"><Music className="w-8 h-8 opacity-50" /><span>Syncing Database...</span></div></td></tr>
                            ) : songs.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No matching records found.</td></tr>
                            ) : (
                                songs.map(song => (
                                    <tr key={song.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-5 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                    <Music className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-base">{song.title}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{song.artist}</div>
                                                    {song.file_path && <span className="mt-1 inline-block text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">FILE</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-white/5 p-2 rounded-lg border border-slate-200/50 dark:border-white/5 w-fit">
                                                <Disc3 className={cn("w-4 h-4", song.album_id ? "text-primary" : "text-slate-300 dark:text-slate-700")} />
                                                <select 
                                                    value={song.album_id || 'none'} 
                                                    onChange={(e) => handleAlbumAssign(song.id, e.target.value)} 
                                                    className="bg-transparent text-xs border-none focus:ring-0 cursor-pointer max-w-[150px] truncate text-slate-600 dark:text-slate-300 hover:text-primary font-medium p-0 pr-6"
                                                >
                                                    <option value="none">No Album</option>
                                                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm", DIFFICULTY_COLORS[song.difficulty] || DIFFICULTY_COLORS['Medium'])}>{song.difficulty}</span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
                                                <Eye className="w-3.5 h-3.5" /> {song.view_count.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                <Link to={`/song/${song.id}`} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"><ExternalLink className="w-4 h-4" /></Link>
                                                <button onClick={() => handleEdit(song)} className="p-2 hover:bg-yellow-500/10 text-slate-400 hover:text-yellow-500 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(song.id, song.file_path)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                    <div className="text-xs text-slate-500">
                        Showing <span className="font-bold">{songs.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SongManager;
