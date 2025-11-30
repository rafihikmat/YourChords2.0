import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Save, ToggleRight, ToggleLeft, PlayCircle, RefreshCw, ExternalLink, Image as ImageIcon, Edit2, X, Youtube, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { VideoTutorial } from '../../../../types';
import { cn } from '../../../../lib/utils';
import YouTubePlayer from '../../../../components/YouTubePlayer';
import { useToast } from '../../../../contexts/ToastContext';

interface VideoManagerProps {
    searchTerm: string;
}

const ITEMS_PER_PAGE = 10;

export const VideoManager: React.FC<VideoManagerProps> = ({ searchTerm }) => {
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    const [inputUrl, setInputUrl] = useState(''); // Raw input for URL/ID
    const [videoForm, setVideoForm] = useState({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const { toast, success, error: toastError } = useToast();

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('video_tutorials')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,channel_title.ilike.%${searchTerm}%,video_id.ilike.%${searchTerm}%`);
            }

            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setVideos(data as unknown as VideoTutorial[]);
            setTotalCount(count || 0);
        } catch (err: any) {
            toastError(err.message || 'Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, toastError]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const extractVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Auto-extract ID when input changes
    useEffect(() => {
        if (!editingVideoId) {
            const extractedId = extractVideoId(inputUrl);
            if (extractedId) {
                setVideoForm(prev => ({ ...prev, video_id: extractedId }));
            } else if (inputUrl.length === 11) {
                setVideoForm(prev => ({ ...prev, video_id: inputUrl }));
            }
        }
    }, [inputUrl, editingVideoId]);

    const fetchYoutubeMetadata = async () => {
        const targetId = videoForm.video_id || extractVideoId(inputUrl);
        
        if (!targetId) {
            toastError('Invalid YouTube URL or ID.');
            return;
        }

        setMetadataLoading(true);
        
        let success = false;
        
        try {
            const { data, error } = await supabase.functions.invoke('get-video-details', {
                body: { videoId: targetId }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setVideoForm(prev => ({
                ...prev,
                video_id: targetId,
                title: data.title,
                channel_title: data.channel_title,
                thumbnail_url: data.thumbnail_url
            }));
            success = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.warn('Edge Function failed, trying fallback:', err);
        }

        if (!success) {
            // Fallback to NoEmbed
            try {
                const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${targetId}`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                setVideoForm(prev => ({
                    ...prev,
                    video_id: targetId,
                    title: data.title,
                    channel_title: data.author_name,
                    thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${targetId}/maxresdefault.jpg`
                }));
                success = true;
            } catch (err) {
                 console.warn('Fallback failed:', err);
            }
        }

        if (!success) {
             const fallbackThumb = `https://img.youtube.com/vi/${targetId}/maxresdefault.jpg`;
             setVideoForm(prev => ({
                ...prev,
                video_id: targetId,
                thumbnail_url: prev.thumbnail_url || fallbackThumb
            }));
            toast('warning', 'Auto-fill failed. ID set, please fill Title manually.', 4000);
        } else {
            if (!editingVideoId) setInputUrl(targetId);
            toast('success', 'Metadata retrieved successfully', 2000);
        }
        setMetadataLoading(false);
    };

    const handleSaveVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!videoForm.video_id) {
            toastError('Video ID is required.');
            return;
        }

        try {
            if (editingVideoId) {
                const { error } = await supabase
                    .from('video_tutorials')
                    .update({
                        title: videoForm.title,
                        channel_title: videoForm.channel_title,
                        thumbnail_url: videoForm.thumbnail_url
                    })
                    .eq('video_id', editingVideoId);
                if (error) throw error;
                success('Video updated successfully');
            } else {
                const { error } = await supabase.from('video_tutorials').insert([videoForm]);
                if (error) throw error;
                success('Video added to library');
            }
            resetVideoForm();
            fetchVideos();
        } catch (err: any) {
            toastError(err.message || 'Failed to save video');
        }
    };

    const handleEditVideo = (video: VideoTutorial) => {
        setEditingVideoId(video.video_id);
        setInputUrl(video.video_id);
        setVideoForm({
            video_id: video.video_id,
            title: video.title,
            channel_title: video.channel_title,
            thumbnail_url: video.thumbnail_url
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm("Permanently delete this video?")) return;
        
        try {
            const { error } = await supabase.from('video_tutorials').delete().eq('video_id', id);
            if (error) throw error;

            if (editingVideoId === id) resetVideoForm();
            success('Video deleted');
            fetchVideos();
        } catch (err: any) {
            toastError(err.message || 'Failed to delete video');
        }
    };

    const toggleVideoActive = async (id: string, currentState: boolean) => {
        try {
            const { error } = await supabase.from('video_tutorials').update({ is_active: !currentState }).eq('video_id', id);
            if (error) throw error;
            
            // Optimistic update
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setVideos(prev => prev.map(v => v.video_id === id ? { ...v, is_active: !currentState } as any : v));
            toast('success', currentState ? 'Video hidden' : 'Video activated', 1500);
        } catch (err: any) {
            toastError(err.message || 'Failed to update status');
        }
    };

    const resetVideoForm = () => {
        setInputUrl('');
        setVideoForm({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
        setEditingVideoId(null);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Memoize Player to prevent reloading during typing
    const previewPlayer = useMemo(() => {
        if (!videoForm.video_id) return null;
        return (
            <div 
                className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-black aspect-video relative group shadow-lg"
                style={{ contain: 'content' }}
            >
                <YouTubePlayer videoId={videoForm.video_id} />
                <div className="absolute top-3 right-3 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase shadow-md pointer-events-none">
                    Preview
                </div>
            </div>
        );
    }, [videoForm.video_id]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-300">
            {/* LEFT COLUMN: CREATE/EDIT FORM */}
            <div className="lg:col-span-1 space-y-6">
                <div className={cn(
                    "p-6 rounded-2xl border shadow-sm sticky top-24 transition-colors duration-300",
                    editingVideoId 
                        ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30" 
                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5"
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
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">YouTube URL or ID</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Youtube className="absolute left-3 top-2.5 w-4 h-4 text-red-500" />
                                    <input 
                                        value={inputUrl} 
                                        onChange={e => setInputUrl(e.target.value)} 
                                        className="w-full pl-10 p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-primary/50 focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                                        placeholder="https://youtube.com/watch?v=..." 
                                        required 
                                        disabled={!!editingVideoId} 
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={fetchYoutubeMetadata} 
                                    disabled={metadataLoading || (!inputUrl && !editingVideoId)} 
                                    className="px-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 min-w-[80px] flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300 disabled:opacity-50"
                                >
                                    {metadataLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : (editingVideoId ? "Refresh" : "Auto-Fill")}
                                </button>
                            </div>
                            {editingVideoId ? (
                                <p className="text-[10px] text-slate-400 mt-1.5 italic">ID cannot be changed. Create new to change.</p>
                            ) : videoForm.video_id && (
                                <p className="text-[10px] text-green-500 mt-1.5 flex items-center gap-1 font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> ID Extracted: {videoForm.video_id}
                                </p>
                            )}
                        </div>

                        {/* Video Preview - ISOLATED */}
                        {previewPlayer}

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">Title</label>
                            <input 
                                value={videoForm.title} 
                                onChange={e => setVideoForm(prev => ({...prev, title: e.target.value}))} 
                                className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                                placeholder="Video Title"
                                required 
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 block">Channel Name</label>
                            <input 
                                value={videoForm.channel_title} 
                                onChange={e => setVideoForm(prev => ({...prev, channel_title: e.target.value}))} 
                                className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                                placeholder="Channel Name"
                                required 
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1.5 flex items-center justify-between">
                                <span>Thumbnail URL</span>
                                {videoForm.thumbnail_url && (
                                    <a href={videoForm.thumbnail_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" /> View
                                    </a>
                                )}
                            </label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input 
                                    value={videoForm.thumbnail_url} 
                                    onChange={e => setVideoForm(prev => ({...prev, thumbnail_url: e.target.value}))} 
                                    className="w-full pl-10 p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/50 outline-none truncate transition-all" 
                                    placeholder="https://..."
                                    required 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={!videoForm.video_id}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold shadow-lg text-sm transition-all active:scale-95 flex items-center justify-center gap-2 hover:scale-105",
                                editingVideoId 
                                    ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20" 
                                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-sm flex flex-col min-h-[600px]">
                    <div className="p-4 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Video Library ({totalCount})</h3>
                    </div>
                    <div className="divide-y divide-slate-200/60 dark:divide-white/5 flex-1">
                        {loading ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                                <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                                <span>Loading videos...</span>
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No videos found.</div>
                        ) : (
                            videos.map((video, idx) => (
                                <div key={idx} className={cn("flex items-start gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group", editingVideoId === video.video_id && "bg-yellow-50/50 dark:bg-yellow-900/20")}>
                                    <div className="w-40 h-24 shrink-0 relative rounded-xl overflow-hidden bg-black shadow-sm group-hover:shadow-md transition-shadow">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <img src={video.thumbnail_url} alt="thumb" className={cn("w-full h-full object-cover transition-opacity", (video as any).is_active === false ? "opacity-50 grayscale" : "")} />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <PlayCircle className="w-8 h-8 text-white opacity-80" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{video.title}</h4>
                                        <p className="text-xs text-slate-500 mb-2">{video.channel_title}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded w-fit">{video.video_id}</span>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(video as any).is_active === false && <span className="text-[10px] font-bold text-red-500 uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Hidden</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 items-end py-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <button onClick={() => toggleVideoActive(video.video_id, (video as any).is_active)} className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors w-24 justify-center", (video as any).is_active !== false ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700")}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(video as any).is_active !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(video as any).is_active !== false ? "Active" : "Hidden"}
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditVideo(video)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-yellow-600 hover:bg-yellow-50 dark:text-yellow-500 dark:hover:bg-yellow-900/20 transition-colors"><Edit2 className="w-3 h-3" /> Edit</button>
                                            <button onClick={() => handleDeleteVideo(video.video_id)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3 h-3" /> Remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > 0 && (
                        <div className="p-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                            <div className="text-xs text-slate-500">
                                Showing <span className="font-bold">{videos.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
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
                </div>
            </div>
        </div>
    );
};
