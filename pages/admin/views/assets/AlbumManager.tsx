import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Disc3, Edit2, Save, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Album } from '../../../../types';
import { cn } from '../../../../lib/utils';
import { useToast } from '../../../../contexts/ToastContext';

interface AlbumManagerProps {
    searchTerm: string;
}

const ITEMS_PER_PAGE = 12; // Grid layout, so multiples of 4/6 are good

export const AlbumManager: React.FC<AlbumManagerProps> = ({ searchTerm }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [formData, setFormData] = useState({ title: '', artist: '', cover_url: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const { toast, success, error: toastError } = useToast();

    const fetchAlbums = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('albums')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
            }

            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setAlbums(data as unknown as Album[]);
            setTotalCount(count || 0);
        } catch (err: any) {
            toastError(err.message || 'Failed to fetch albums');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, toastError]);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const handleSaveAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.artist) return;
        
        const payload = { 
            title: formData.title,
            artist: formData.artist,
            cover_url: formData.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.title)}&background=random` 
        };
        
        try {
            if (editingId) {
                const { error } = await supabase.from('albums').update(payload).eq('id', editingId);
                if (error) throw error;
                success('Album updated successfully');
            } else {
                const { error } = await supabase.from('albums').insert([payload]);
                if (error) throw error;
                success('Album created successfully');
            }
            resetForm();
            fetchAlbums();
        } catch (err: any) {
            toastError(err.message || 'Failed to save album');
        }
    };

    const handleEdit = (album: Album) => {
        setFormData({
            title: album.title,
            artist: album.artist,
            cover_url: album.cover_url
        });
        setEditingId(album.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAlbum = async (id: string) => {
        if (!confirm("Permanently delete this album? Songs assigned to this album will be unassigned.")) return;
        
        try {
            const { error } = await supabase.from('albums').delete().eq('id', id);
            if (error) throw error;
            
            if (editingId === id) resetForm();
            success('Album deleted');
            fetchAlbums();
        } catch (err: any) {
            toastError(err.message || 'Failed to delete album');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', artist: '', cover_url: '' });
        setEditingId(null);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* Create/Edit Album Form */}
            <div className={cn(
                "p-6 rounded-2xl border shadow-sm transition-all duration-300",
                editingId 
                    ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30" 
                    : "bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5"
            )}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Edit2 className="w-4 h-4 text-yellow-600" /> : <Plus className="w-4 h-4 text-primary" />} 
                        {editingId ? "Edit Album" : "Create Album"}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <X className="w-3 h-3" /> Cancel
                        </button>
                    )}
                </div>

                <form onSubmit={handleSaveAlbum} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">Title</label>
                        <input 
                            required 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                            placeholder="Album Name"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">Artist</label>
                        <input 
                            required 
                            value={formData.artist} 
                            onChange={e => setFormData({...formData, artist: e.target.value})} 
                            className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                            placeholder="Artist Name"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">Cover URL</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                value={formData.cover_url} 
                                onChange={e => setFormData({...formData, cover_url: e.target.value})} 
                                className="w-full pl-10 p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                                placeholder="Auto-generated if empty" 
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold shadow-lg text-sm transition-all active:scale-95 flex items-center justify-center gap-2 hover:scale-105",
                            editingId 
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20" 
                                : "bg-gradient-to-r from-primary to-purple-600 hover:shadow-primary/25 text-white"
                        )}
                    >
                        {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingId ? "Update" : "Create"}
                    </button>
                </form>
            </div>

            {/* Album Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                    <Disc3 className="w-8 h-8 animate-spin opacity-50" />
                    <span>Loading albums...</span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {albums.map(album => (
                            <div 
                                key={album.id} 
                                className={cn(
                                    "group relative bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                                    editingId === album.id ? "border-yellow-500 ring-2 ring-yellow-500/20" : "border-slate-200/60 dark:border-white/5"
                                )}
                            >
                                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    {!album.cover_url && <Disc3 className="absolute inset-0 m-auto w-12 h-12 text-slate-400" />}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                        <button 
                                            onClick={() => handleEdit(album)}
                                            className="p-2.5 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-full hover:scale-110 transition-all shadow-lg"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAlbum(album.id)}
                                            className="p-2.5 bg-red-500/90 text-white rounded-full hover:scale-110 transition-all shadow-lg"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={album.title}>{album.title}</h4>
                                    <p className="text-xs text-slate-500 truncate font-medium">{album.artist}</p>
                                </div>
                            </div>
                        ))}
                        {albums.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                                No albums found.
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/5 pt-4">
                             <div className="text-xs text-slate-500">
                                Showing <span className="font-bold">{albums.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
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
                    )}
                </>
            )}
        </div>
    );
};
