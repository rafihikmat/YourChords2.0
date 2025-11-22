
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Disc3, Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Album } from '../../../../types';
import { fuzzySearch, cn } from '../../../../lib/utils';

interface AlbumManagerProps {
    searchTerm: string;
}

export const AlbumManager: React.FC<AlbumManagerProps> = ({ searchTerm }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [formData, setFormData] = useState({ title: '', artist: '', cover_url: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlbums();
    }, []);

    const fetchAlbums = async () => {
        setLoading(true);
        const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
        if (data) setAlbums(data as unknown as Album[]);
        setLoading(false);
    };

    const handleSaveAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.artist) return;
        
        // Default avatar if empty
        const payload = { 
            title: formData.title,
            artist: formData.artist,
            cover_url: formData.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.title)}&background=random` 
        };
        
        let error;

        if (editingId) {
            // Update Mode
            const { error: updateError } = await supabase
                .from('albums')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            // Create Mode
            const { error: insertError } = await supabase
                .from('albums')
                .insert([payload]);
            error = insertError;
        }

        if (!error) {
            resetForm();
            fetchAlbums();
        } else {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (album: Album) => {
        setFormData({
            title: album.title,
            artist: album.artist,
            cover_url: album.cover_url
        });
        setEditingId(album.id);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAlbum = async (id: string) => {
        if (confirm("Permanently delete this album? Songs assigned to this album will be unassigned.")) {
            await supabase.from('albums').delete().eq('id', id);
            if (editingId === id) resetForm();
            fetchAlbums();
        }
    };

    const resetForm = () => {
        setFormData({ title: '', artist: '', cover_url: '' });
        setEditingId(null);
    };

    const filteredAlbums = fuzzySearch<Album>(albums, searchTerm, ['title', 'artist']);

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* Create/Edit Album Form */}
            <div className={cn(
                "p-6 rounded-xl border shadow-sm transition-all",
                editingId 
                    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            )}>
                <div className="flex justify-between items-center mb-4">
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

                <form onSubmit={handleSaveAlbum} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Title</label>
                        <input 
                            required 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                            placeholder="Album Name"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Artist</label>
                        <input 
                            required 
                            value={formData.artist} 
                            onChange={e => setFormData({...formData, artist: e.target.value})} 
                            className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                            placeholder="Artist Name"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cover URL</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                value={formData.cover_url} 
                                onChange={e => setFormData({...formData, cover_url: e.target.value})} 
                                className="w-full pl-9 p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                                placeholder="Auto-generated if empty" 
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        className={cn(
                            "px-4 py-2 rounded font-bold shadow-lg text-sm h-[38px] transition-all active:scale-95 flex items-center justify-center gap-2",
                            editingId 
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20" 
                                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                        )}
                    >
                        {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingId ? "Update" : "Create"}
                    </button>
                </form>
            </div>

            {/* Album Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading albums...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredAlbums.map(album => (
                        <div 
                            key={album.id} 
                            className={cn(
                                "group relative bg-white dark:bg-slate-900 border rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-sm",
                                editingId === album.id ? "border-yellow-500 ring-1 ring-yellow-500" : "border-slate-200 dark:border-white/10"
                            )}
                        >
                            <div className="aspect-square bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                {!album.cover_url && <Disc3 className="absolute inset-0 m-auto w-12 h-12 text-slate-400" />}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleEdit(album)}
                                        className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors shadow-lg"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteAlbum(album.id)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={album.title}>{album.title}</h4>
                                <p className="text-xs text-slate-500 truncate">{album.artist}</p>
                            </div>
                        </div>
                    ))}
                    {filteredAlbums.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                            No albums found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
