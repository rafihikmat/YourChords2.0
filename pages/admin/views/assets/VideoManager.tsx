
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ToggleRight, ToggleLeft, PlayCircle, Video, RefreshCw, ExternalLink, Image as ImageIcon, Edit2, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { VideoTutorial } from '../../../../types';
import { cn, fuzzySearch } from '../../../../lib/utils';
import YouTubePlayer from '../../../../components/YouTubePlayer';

interface VideoManagerProps {
    searchTerm: string;
}

export const VideoManager: React.FC<VideoManagerProps> = ({ searchTerm }) => {
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    const [videoForm, setVideoForm] = useState({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        const { data } = await supabase.from('video_tutorials').select('*').order('created_at', { ascending: false });
        if (data) setVideos(data as unknown as VideoTutorial[]);
        setLoading(false);
    };

    const fetchYoutubeMetadata = async () => {
        if (!videoForm.video_id) return;
        setMetadataLoading(true);
        
        try {
            const { data, error } = await supabase.functions.invoke('get-video-details', {
                body: { videoId: videoForm.video_id }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setVideoForm(prev => ({
                ...prev,
                title: data.title,
                channel_title: data.channel_title,
                thumbnail_url: data.thumbnail_url
            }));
        } catch (err: any) {
            console.error('Metadata fetch failed:', err);
            const fallbackThumb = `https://img.youtube.com/vi/${videoForm.video_id}/mqdefault.jpg`;
            setVideoForm(prev => ({
                ...prev,
                thumbnail_url: prev.thumbnail_url || fallbackThumb
            }));
            alert(`Auto-fill failed (${err.message}). You can enter details manually.`);
        } finally {
            setMetadataLoading(false);
        }
    };

    const handleSaveVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let error;
        if (editingVideoId) {
            // Update existing
            const { error: updateError } = await supabase
                .from('video_tutorials')
                .update({
                    title: videoForm.title,
                    channel_title: videoForm.channel_title,
                    thumbnail_url: videoForm.thumbnail_url
                })
                .eq('video_id', editingVideoId);
            error = updateError;
        } else {
            // Create new
            const { error: insertError } = await supabase.from('video_tutorials').insert([videoForm]);
            error = insertError;
        }

        if (!error) {
            resetVideoForm();
            fetchVideos();
        } else {
            alert('Error saving video: ' + error.message);
        }
    };

    const handleEditVideo = (video: VideoTutorial) => {
        setEditingVideoId(video.video_id);
        setVideoForm({
            video_id: video.video_id,
            title: video.title,
            channel_title: video.channel_title,
            thumbnail_url: video.thumbnail_url
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteVideo = async (id: string) => {
        if (confirm("Permanently delete this video?")) {
            await supabase.from('video_tutorials').delete().eq('video_id', id);
            if (editingVideoId === id) resetVideoForm();
            fetchVideos();
        }
    };

    const toggleVideoActive = async (id: string, currentState: boolean) => {
        await supabase.from('video_tutorials').update({ is_active: !currentState }).eq('video_id', id);
        setVideos(prev => prev.map(v => v.video_id === id ? { ...v, is_active: !currentState } as any : v));
    };

    const resetVideoForm = () => {
        setVideoForm({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
        setEditingVideoId(null);
    };

    const filteredVideos = fuzzySearch<VideoTutorial>(videos, searchTerm, ['title', 'channel_title', 'video_id']);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-300">
            {/* LEFT COLUMN: CREATE/EDIT FORM */}
            <div className="lg:col-span-1 space-y-6">
                <div className={cn(
                    "p-6 rounded-xl border shadow-sm sticky top-24 transition-colors",
                    editingVideoId 
                        ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                )}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {editingVideoId ? <Edit2 className="w-4 h-4 text-yellow-500" /> : <Plus className="w-4 h-4 text-primary" />}
                            {editingVideoId ? "Edit Tutorial Video" : "Add Tutorial Video"}
                        </h3>
                        {editingVideoId && (
                            <button onClick={resetVideoForm} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                <X className="w-3 h-3" /> Cancel
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSaveVideo} className="space-y-5">
                        {/* Video ID + Auto-fill */}
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">YouTube Video ID</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Video className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        value={videoForm.video_id} 
                                        onChange={e => setVideoForm({...videoForm, video_id: e.target.value})} 
                                        className="w-full pl-9 p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                                        placeholder="e.g. dQw4w9WgXcQ" 
                                        required 
                                        disabled={!!editingVideoId} // Disable ID edit as it's PK
                                    />
                                </div>
                                {!editingVideoId && (
                                    <button 
                                        type="button" 
                                        onClick={fetchYoutubeMetadata} 
                                        disabled={metadataLoading || !videoForm.video_id} 
                                        className="px-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 min-w-[80px] flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                                    >
                                        {metadataLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Auto-Fill"}
                                    </button>
                                )}
                            </div>
                            {editingVideoId && <p className="text-[10px] text-slate-400 mt-1 italic">Video ID cannot be changed once created.</p>}
                        </div>

                        {/* Video Preview (If ID exists) */}
                        {videoForm.video_id && (
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-black aspect-video relative group">
                                <YouTubePlayer videoId={videoForm.video_id} />
                                <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase shadow-md pointer-events-none">
                                    Preview
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Custom Title</label>
                            <input value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none" required />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Channel Name</label>
                            <input value={videoForm.channel_title} onChange={e => setVideoForm({...videoForm, channel_title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none" required />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">
                                <span>Thumbnail URL</span>
                                {videoForm.thumbnail_url && (
                                    <a href={videoForm.thumbnail_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" /> View
                                    </a>
                                )}
                            </label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input value={videoForm.thumbnail_url} onChange={e => setVideoForm({...videoForm, thumbnail_url: e.target.value})} className="w-full pl-9 p-2 rounded border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none truncate" required />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className={cn(
                                "w-full py-3 rounded-lg font-bold shadow-lg text-sm transition-all active:scale-95 flex items-center justify-center gap-2",
                                editingVideoId ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                            )}
                        >
                            {editingVideoId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editingVideoId ? 'Update Video' : 'Add Video to Library'}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT COLUMN: LIST */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Video Library ({filteredVideos.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-white/5">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading videos...</div>
                        ) : filteredVideos.map((video, idx) => (
                            <div key={idx} className={cn("flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group", editingVideoId === video.video_id && "bg-yellow-50/50 dark:bg-yellow-900/20")}>
                                <div className="w-40 h-24 shrink-0 relative rounded-lg overflow-hidden bg-black shadow-sm">
                                    <img src={video.thumbnail_url} alt="thumb" className={cn("w-full h-full object-cover transition-opacity", (video as any).is_active === false ? "opacity-50 grayscale" : "")} />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEditVideo(video)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-yellow-600 hover:bg-yellow-50 dark:text-yellow-500 dark:hover:bg-yellow-900/20 transition-colors"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteVideo(video.video_id)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!loading && filteredVideos.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">No videos found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
