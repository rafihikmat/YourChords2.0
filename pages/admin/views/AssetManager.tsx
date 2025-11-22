
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ToggleRight, ToggleLeft, AlertCircle, PlayCircle, Disc3, Video, RefreshCw, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Album, VideoTutorial } from '../../../types';
import { cn, fuzzySearch } from '../../../lib/utils';
import YouTubePlayer from '../../../components/YouTubePlayer';

const AssetManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');
    const [albums, setAlbums] = useState<Album[]>([]);
    const [newAlbum, setNewAlbum] = useState({ title: '', artist: '', cover_url: '' });
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    const [newVideo, setNewVideo] = useState({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [metadataLoading, setMetadataLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: a } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
        if (a) setAlbums(a as unknown as Album[]);
        const { data: v } = await supabase.from('video_tutorials').select('*').order('created_at', { ascending: false });
        if (v) setVideos(v as unknown as VideoTutorial[]);
    };

    // --- Album Logic ---
    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlbum.title || !newAlbum.artist) return;
        const payload = { ...newAlbum, cover_url: newAlbum.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(newAlbum.title)}&background=random` };
        const { error } = await supabase.from('albums').insert([payload]);
        if (!error) {
            setNewAlbum({ title: '', artist: '', cover_url: '' });
            fetchData();
        } else {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteAlbum = async (id: string) => {
        if (confirm("Permanently delete this album?")) {
            await supabase.from('albums').delete().eq('id', id);
            fetchData();
        }
    };

    // --- Video Logic ---
    const fetchYoutubeMetadata = async () => {
        if (!newVideo.video_id) return;
        setMetadataLoading(true);
        
        try {
            const { data, error } = await supabase.functions.invoke('get-video-details', {
                body: { videoId: newVideo.video_id }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setNewVideo(prev => ({
                ...prev,
                title: data.title,
                channel_title: data.channel_title,
                thumbnail_url: data.thumbnail_url
            }));
        } catch (err: any) {
            console.error('Metadata fetch failed:', err);
            alert('Failed to fetch video details: ' + err.message);
            // Fallback
            if (!newVideo.thumbnail_url) {
                setNewVideo(prev => ({
                    ...prev,
                    thumbnail_url: `https://img.youtube.com/vi/${prev.video_id}/mqdefault.jpg`
                }));
            }
        } finally {
            setMetadataLoading(false);
        }
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('video_tutorials').insert([newVideo]);
        if (!error) {
            setNewVideo({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
            fetchData();
        } else {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (confirm("Permanently delete this video?")) {
            await supabase.from('video_tutorials').delete().eq('video_id', id);
            fetchData();
        }
    };

    const toggleVideoActive = async (id: string, currentState: boolean) => {
        await supabase.from('video_tutorials').update({ is_active: !currentState }).eq('video_id', id);
        setVideos(prev => prev.map(v => v.video_id === id ? { ...v, is_active: !currentState } as any : v));
    };

    // Filter Lists
    const filteredAlbums = fuzzySearch<Album>(albums, searchTerm, ['title', 'artist']);
    const filteredVideos = fuzzySearch<VideoTutorial>(videos, searchTerm, ['title', 'channel_title', 'video_id']);

    return (
        <div className="p-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Assets</h1>
                    <p className="text-slate-500">Manage multimedia resources.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <input 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-48" 
                    />
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

             {activeTab === 'albums' && (
                 <div className="space-y-8">
                    {/* Create Album Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-4 h-4" /> Create Album</h3>
                        <form onSubmit={handleCreateAlbum} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Title</label>
                                <input required value={newAlbum.title} onChange={e => setNewAlbum({...newAlbum, title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Artist</label>
                                <input required value={newAlbum.artist} onChange={e => setNewAlbum({...newAlbum, artist: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cover URL</label>
                                <input value={newAlbum.cover_url} onChange={e => setNewAlbum({...newAlbum, cover_url: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm" placeholder="Auto-generated if empty" />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20 text-sm h-[38px]">Create</button>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredAlbums.map(album => (
                            <div key={album.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-sm">
                                <div className="aspect-square bg-slate-200 dark:bg-slate-800 relative">
                                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={album.title}>{album.title}</h4>
                                    <p className="text-xs text-slate-500 truncate">{album.artist}</p>
                                </div>
                                <button className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md" onClick={() => handleDeleteAlbum(album.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {activeTab === 'videos' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* LEFT COLUMN: CREATE FORM */}
                     <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm sticky top-24">
                            <h3 className="font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" /> Add Tutorial Video
                            </h3>
                            
                            <form onSubmit={handleAddVideo} className="space-y-5">
                                {/* Video ID + Auto-fill */}
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">YouTube Video ID</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Video className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input 
                                                value={newVideo.video_id} 
                                                onChange={e => setNewVideo({...newVideo, video_id: e.target.value})} 
                                                className="w-full pl-9 p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none" 
                                                placeholder="e.g. dQw4w9WgXcQ" 
                                                required 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={fetchYoutubeMetadata} 
                                            disabled={metadataLoading || !newVideo.video_id} 
                                            className="px-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 min-w-[80px] flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                                        >
                                            {metadataLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Auto-Fill"}
                                        </button>
                                    </div>
                                </div>

                                {/* Video Preview (If ID exists) */}
                                {newVideo.video_id && (
                                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-black aspect-video relative group">
                                        <YouTubePlayer videoId={newVideo.video_id} />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase shadow-md pointer-events-none">
                                            Preview
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Custom Title</label>
                                    <input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none" required />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Channel Name</label>
                                    <input value={newVideo.channel_title} onChange={e => setNewVideo({...newVideo, channel_title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none" required />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">
                                        <span>Thumbnail URL</span>
                                        {newVideo.thumbnail_url && (
                                            <a href={newVideo.thumbnail_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> View
                                            </a>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input value={newVideo.thumbnail_url} onChange={e => setNewVideo({...newVideo, thumbnail_url: e.target.value})} className="w-full pl-9 p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none truncate" required />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-red-500/20 text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Add Video to Library
                                </button>
                            </form>
                        </div>
                     </div>

                     {/* RIGHT COLUMN: LIST */}
                     <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Video Library ({filteredVideos.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-200 dark:divide-white/5">
                                {filteredVideos.map((video, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <div className="w-40 h-24 shrink-0 relative rounded-lg overflow-hidden bg-black shadow-sm">
                                            <img src={video.thumbnail_url} alt="thumb" className={cn("w-full h-full object-cover transition-opacity", (video as any).is_active === false ? "opacity-50 grayscale" : "")} />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <PlayCircle className="w-8 h-8 text-white opacity-80" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 py-1">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{video.title}</h4>
                                            <p className="text-xs text-slate-500 mb-2">{video.channel_title}</p>
                                            <p className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded w-fit">{video.video_id}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 items-end py-1">
                                            <button 
                                                onClick={() => toggleVideoActive(video.video_id, (video as any).is_active)}
                                                className={cn(
                                                    "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors w-24 justify-center",
                                                    (video as any).is_active !== false 
                                                        ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                                                )}
                                            >
                                                {(video as any).is_active !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                {(video as any).is_active !== false ? "Active" : "Hidden"}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDeleteVideo(video.video_id)}
                                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredVideos.length === 0 && (
                                    <div className="p-8 text-center text-slate-500 text-sm">No videos found.</div>
                                )}
                            </div>
                        </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default AssetManager;
