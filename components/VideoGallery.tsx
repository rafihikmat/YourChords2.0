
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlayCircle, Search, Youtube, Video, Heart } from "lucide-react";
import { VideoTutorial } from '../types';
import { cn } from '../lib/utils';
import YouTubePlayer from './YouTubePlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSmartSearch } from '../lib/hooks/useSmartSearch';

export const VideoGallery: React.FC = () => {
  const [allVideos, setAllVideos] = useState<VideoTutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Favorites Logic
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (user) fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data } = await supabase
        .from('video_tutorials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
          setAllVideos(data as unknown as VideoTutorial[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
      if (!user) return;
      const { data } = await supabase.from('video_favorites').select('video_id').eq('user_id', user.id);
      if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFavoriteIds(data.map((item: any) => item.video_id));
      }
  };

  const toggleFavorite = async (e: React.MouseEvent, videoId: string) => {
      e.stopPropagation();
      if (!user) {
          navigate('/auth');
          return;
      }

      if (favoriteIds.includes(videoId)) {
          // Remove
          setFavoriteIds(prev => prev.filter(id => id !== videoId));
          await supabase.from('video_favorites').delete().eq('user_id', user.id).eq('video_id', videoId);
      } else {
          // Add
          setFavoriteIds(prev => [...prev, videoId]);
          await supabase.from('video_favorites').insert({ user_id: user.id, video_id: videoId });
      }
  };

  // Use the new Smart Search Hook with generic
  const filteredVideos = useSmartSearch<VideoTutorial>(allVideos, searchQuery, ['title', 'channel_title']);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-red-500" /> 
                  Video Masterclass
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Curated tutorials from the best instructors on the web.</p>
          </div>
          
          <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a tutorial..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
              />
          </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
              [1,2,3].map(i => (
                  <div key={i} className="aspect-video bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
              ))
          ) : filteredVideos.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <Video className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No tutorials found matching "{searchQuery}"</p>
              </div>
          ) : (
              filteredVideos.map((video) => (
                  <motion.div 
                    layoutId={video.video_id}
                    key={video.video_id} 
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setSelectedVideoId(video.video_id)}
                  >
                      <div className="aspect-video bg-slate-900 relative overflow-hidden">
                           <img 
                               src={video.thumbnail_url} 
                               alt={video.title} 
                               className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                           />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                   <PlayCircle className="w-12 h-12 text-white fill-white/20" />
                               </div>
                           </div>
                           
                           {/* Favorites Button */}
                           <button
                                onClick={(e) => toggleFavorite(e, video.video_id)}
                                className="absolute top-2 right-2 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors z-20"
                           >
                               <Heart className={cn("w-4 h-4", favoriteIds.includes(video.video_id) ? "fill-red-500 text-red-500" : "text-white")} />
                           </button>

                           <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">
                               VIDEO
                           </div>
                      </div>
                      <div className="p-4">
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-primary transition-colors">{video.title}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{video.channel_title}</span>
                          </div>
                      </div>
                  </motion.div>
              ))
          )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
          {selectedVideoId && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedVideoId(null)}>
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                      onClick={e => e.stopPropagation()}
                  >
                      <YouTubePlayer videoId={selectedVideoId} />
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
