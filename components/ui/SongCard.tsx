
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, Star, Activity } from 'lucide-react';
import { Song } from '../../types';
import { cn } from '../../lib/utils';

interface SongCardProps {
  song: Song;
  onClick?: () => void;
  className?: string;
}

const difficultyColorMap = {
  Easy: "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Hard: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Expert: "text-red-500 bg-red-500/10 border-red-500/20",
};

const SongCard: React.FC<SongCardProps> = ({ song, onClick, className }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] cursor-pointer dark:bg-slate-950 bg-white dark:border-white/10 border-slate-200",
        className
      )}
      onClick={onClick}
    >
      {/* Hover Gradient Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 group-hover:from-primary group-hover:to-secondary transition-colors duration-300">
          <Play className="w-4 h-4 text-slate-400 group-hover:text-white fill-current transition-colors" />
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-[10px] font-mono font-bold uppercase border tracking-wider",
          difficultyColorMap[song.difficulty] || "text-slate-400 bg-slate-400/10 border-slate-400/20"
        )}>
          {song.difficulty}
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
          {song.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{song.view_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          {song.youtube_video_id && <Activity className="w-3 h-3 text-red-400" />}
          {song.spotify_track_id && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        </div>
      </div>
    </motion.div>
  );
};

export default SongCard;
