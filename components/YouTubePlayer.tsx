
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, AlertTriangle } from "lucide-react";
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
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // --- 1. Initialization Logic (Fixes Black Screen Race Condition) ---
  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    setIsReady(false);
    setHasError(false);

    const loadVideo = () => {
      if (!containerRef.current) return;

      try {
        // Cleanup existing instance if any
        if (playerRef.current) {
            playerRef.current.destroy();
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
              if (isMounted) {
                setIsReady(true);
                setDuration(event.target.getDuration());
                event.target.setVolume(volume);
                if (onReady) onReady();
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const playing = event.data === window.YT.PlayerState.PLAYING;
              setIsPlaying(playing);
              
              // Ensure duration is captured if it wasn't ready earlier
              if (playing && !duration) {
                 setDuration(event.target.getDuration());
              }
            },
            onError: (e: any) => {
                console.error("YouTube Player Error:", e);
                if (isMounted) setHasError(true);
            }
          },
        });
      } catch (e) {
        console.error("Error initializing YT Player", e);
        setHasError(true);
      }
    };

    // CRITICAL FIX: Check if API is ALREADY ready
    if (window.YT && window.YT.Player) {
      loadVideo();
    } else {
      // If not, check if script tag exists
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Hook into the global callback
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        loadVideo();
      };
    }

    // Fallback: If YouTube API hangs, show error state after 5 seconds so UI isn't stuck
    const fallbackTimer = setTimeout(() => {
        if (!isReady && !playerRef.current) {
            setHasError(true);
        }
    }, 5000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
            playerRef.current.destroy();
        } catch (e) {
            // Ignore destroy errors on unmount
        }
      }
    };
  }, [videoId]);

  // --- 2. Performance Optimized Loop (Fixes Lag) ---
  useEffect(() => {
    if (!isPlaying || !isReady) return;

    // Updates UI every 800ms instead of 100ms
    // We use CSS transitions on the progress bar to smooth the movement
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (onTimeUpdate) onTimeUpdate(time);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, isReady, onTimeUpdate]);

  // --- Controls ---
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time); // Immediate UI update
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const skip = (seconds: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!playerRef.current) return;
      const newTime = Math.min(Math.max(currentTime + seconds, 0), duration);
      setCurrentTime(newTime);
      playerRef.current.seekTo(newTime, true);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) setIsMuted(false);
    }
  };

  // --- UI Render ---
  if (hasError) {
      return (
          <div className={cn("aspect-video w-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-500 border border-slate-800", className)}>
              <AlertTriangle className="w-10 h-10 mb-2 text-yellow-500" />
              <p className="text-sm font-medium">Video unavailable</p>
              <p className="text-xs opacity-60">Check ID or connection</p>
          </div>
      );
  }

  return (
    <div 
        className={cn("group relative rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800 isolate", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video w-full relative bg-black">
         {/* The Iframe Container */}
         <div ref={containerRef} className="w-full h-full" />
         
         {/* Loading Overlay */}
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
            (isHovered || !isPlaying) && isReady ? "opacity-100" : "opacity-0"
        )}
      >
         {/* Progress Bar */}
         <div className="flex items-center gap-3 text-xs font-mono text-slate-300 select-none">
             <span className="w-10 text-right">{formatTime(currentTime)}</span>
             <div className="flex-1 relative h-1 bg-white/20 rounded-full group/slider cursor-pointer overflow-hidden">
                 <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    step="1" 
                    value={currentTime} 
                    onChange={handleSeek} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" 
                 />
                 <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-linear will-change-[width]" 
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
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

// Memoize to prevent re-renders from parent updates unless videoId changes
export default React.memo(YouTubePlayer);
