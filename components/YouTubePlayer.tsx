
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn, formatTime } from "../lib/utils";

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, className, onTimeUpdate, onReady }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  
  // Direct DOM Refs (Performance Optimization)
  // Using refs prevents React re-renders during high-frequency updates (60fps)
  const progressBarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeTextRef = useRef<HTMLSpanElement>(null);
  const rangeInputRef = useRef<HTMLInputElement>(null);

  // State (Only for low-frequency changes)
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // --- Optimization: Direct DOM Update Loop ---
  // Moves UI updates out of React's render cycle to prevent lag
  const updateLoop = useCallback(() => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const time = playerRef.current.getCurrentTime();
      
      // 1. Direct DOM updates (Zero React Overhead)
      if (rangeInputRef.current) rangeInputRef.current.value = time.toString();
      if (timeTextRef.current) timeTextRef.current.innerText = formatTime(time);
      
      const percent = (time / (duration || 1)) * 100;
      if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
      if (thumbRef.current) thumbRef.current.style.left = `${percent}%`;

      // 2. Callback for parent logic (if provided)
      if (onTimeUpdate) onTimeUpdate(time);
    }
    
    if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(updateLoop);
    }
  }, [isPlaying, duration, onTimeUpdate]);

  useEffect(() => {
    if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(updateLoop);
    } else {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }
    return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, updateLoop]);

  // --- Initialization ---
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const createPlayer = () => {
        if (!containerRef.current) return;
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch(e) {}
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                playsinline: 1,
                origin: window.location.origin
            },
            events: {
                onReady: (event: any) => {
                    setIsReady(true);
                    setDuration(event.target.getDuration());
                    event.target.setVolume(volume);
                    onReady?.();
                },
                onStateChange: (event: any) => {
                    const playing = event.data === window.YT.PlayerState.PLAYING;
                    setIsPlaying(playing);
                    if (playing) {
                        const dur = event.target.getDuration();
                        if(dur) setDuration(dur);
                    }
                },
            },
        });
    };

    if (window.YT && window.YT.Player) {
        createPlayer();
    } else {
        const existingCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (existingCallback) existingCallback();
            createPlayer();
        };
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
      }
    };
  }, [videoId]);

  // --- Controls ---
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current || !isReady) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    // Update UI immediately for responsiveness
    if (timeTextRef.current) timeTextRef.current.innerText = formatTime(time);
    const percent = (time / (duration || 1)) * 100;
    if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${percent}%`;
    
    if (playerRef.current) playerRef.current.seekTo(time, true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) setIsMuted(false);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!playerRef.current) return;
      if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
      } else {
          playerRef.current.mute();
          setIsMuted(true);
      }
  };

  const skip = (seconds: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!playerRef.current || !playerRef.current.getCurrentTime) return;
      const curr = playerRef.current.getCurrentTime();
      const newTime = Math.min(Math.max(curr + seconds, 0), duration);
      playerRef.current.seekTo(newTime, true);
      
      // Immediate UI feedback
      if (rangeInputRef.current) rangeInputRef.current.value = newTime.toString();
  };

  return (
    <div 
        className={cn("group relative rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800 isolate transform-gpu", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // Hardware acceleration enforcement
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
    >
      <div className="aspect-video w-full relative bg-black">
         <div ref={containerRef} className="w-full h-full" />
         {!isReady && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 z-10">
                 <Loader2 className="w-8 h-8 animate-spin" />
             </div>
         )}
      </div>

      {/* Custom Controls Overlay */}
      <div 
        className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 flex flex-col gap-2 z-20",
            isHovered || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
         {/* Progress Bar */}
         <div className="flex items-center gap-3 text-xs font-mono text-slate-300 select-none">
             <span ref={timeTextRef} className="w-10 text-right">0:00</span>
             <div className="flex-1 relative h-1 bg-white/20 rounded-full group/slider cursor-pointer">
                 {/* Uncontrolled input for performance */}
                 <input 
                    ref={rangeInputRef}
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    step="0.1" 
                    defaultValue="0"
                    onChange={handleSeek} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                 />
                 <div 
                    ref={progressBarRef}
                    className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none transition-none will-change-[width]" 
                    style={{ width: '0%' }} 
                 />
                 <div 
                    ref={thumbRef}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity will-change-[left]" 
                    style={{ left: '0%' }} 
                 />
             </div>
             <span className="w-10">{formatTime(duration)}</span>
         </div>

         {/* Buttons */}
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <button onClick={(e) => skip(-10, e)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"><SkipBack className="w-4 h-4" /></button>
                 <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20">
                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                 </button>
                 <button onClick={(e) => skip(10, e)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"><SkipForward className="w-4 h-4" /></button>
             </div>

             <div className="flex items-center gap-2 group/volume">
                 <button onClick={toggleMute} className="text-slate-300 hover:text-white p-2">
                     {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </button>
                 <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                    <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when parent state changes (like typing in forms)
export default React.memo(YouTubePlayer);
