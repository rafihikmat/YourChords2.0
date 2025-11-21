
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, Star, Activity, Heart } from 'lucide-react';
import { Song } from '../../types';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SongCardProps {
  song: Song;
  className?: string;
}

const difficultyColorMap = {
  Easy: "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Hard: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Expert: "text-red-500 bg-red-500/10 border-red-500/20",
};

const SongCard: React.FC<SongCardProps> = ({ song, className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
      fetchRating();
    }
  }, [user, song.id]);

  const checkFavoriteStatus = async () => {
    const { data } = await supabase
      .from('song_favorites')
      .select('*')
      .eq('user_id', user?.id)
      .eq('song_id', song.id)
      .single();
    if (data) setIsFavorite(true);
  };

  const fetchRating = async () => {
      const { data } = await supabase
        .from('song_ratings')
        .select('rating')
        .eq('user_id', user?.id)
        .eq('song_id', song.id)
        .single();
      if (data) setUserRating(data.rating);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        navigate('/auth');
        return;
    }

    if (isFavorite) {
      await supabase.from('song_favorites').delete().eq('user_id', user.id).eq('song_id', song.id);
      setIsFavorite(false);
    } else {
      await supabase.from('song_favorites').insert({ user_id: user.id, song_id: song.id });
      setIsFavorite(true);
    }
  };

  const handleRate = async (rating: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
          navigate('/auth');
          return;
      }
      setUserRating(rating);
      await supabase.from('song_ratings').upsert({ user_id: user.id, song_id: song.id, rating });
  };

  const handleCardClick = () => {
      navigate(`/song/${song.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-5 backdrop-blur-sm transition-all cursor-pointer dark:bg-slate-950 bg-white dark:border-white/10 border-slate-200 shadow-lg",
        "hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] hover:border-primary/50",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Hover Gradient Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 group-hover:from-primary group-hover:to-secondary transition-colors duration-300 shadow-lg">
          <Play className="w-4 h-4 text-slate-400 group-hover:text-white fill-current transition-colors ml-0.5" />
        </div>
        
        <div className="flex items-center gap-2">
             <div className={cn(
                "px-2 py-1 rounded-full text-[10px] font-mono font-bold uppercase border tracking-wider",
                difficultyColorMap[song.difficulty] || "text-slate-400 bg-slate-400/10 border-slate-400/20"
            )}>
                {song.difficulty}
            </div>
            <button 
                onClick={toggleFavorite}
                className={cn(
                    "p-1.5 rounded-full transition-all hover:bg-white/10 z-20 relative",
                    isFavorite ? "text-pink-500" : "text-slate-600 dark:text-slate-500 hover:text-pink-400"
                )}
            >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </button>
        </div>
      </div>

      <div className="space-y-1 relative z-10 mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
          {song.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col gap-3 relative z-10">
        
        {/* Interactive Ratings */}
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={(e) => handleRate(star, e)}
                        className="focus:outline-none transition-transform hover:scale-125 relative z-20"
                    >
                        <Star 
                            className={cn(
                                "w-4 h-4 transition-colors", 
                                (hoverRating ? star <= hoverRating : star <= userRating) 
                                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" 
                                    : "text-slate-300 dark:text-slate-700"
                            )} 
                        />
                    </button>
                ))}
            </div>
            {userRating > 0 && (
                <span className="text-[10px] text-slate-400 font-medium">You rated: {userRating}</span>
            )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{song.view_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
            {song.youtube_video_id && <Activity className="w-3 h-3 text-red-400" />}
            {song.spotify_track_id && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SongCard;
