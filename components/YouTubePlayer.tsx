
import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && containerRef.current) {
        // Cleanup previous instance if exists
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch(e) {}
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            controls: 0, // We use custom controls
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1
          },
          events: {
            onReady: (event: any) => {
              setIsReady(true);
              setDuration(event.target.getDuration());
              event.target.setVolume(volume);
              onReady?.();
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              if (event.data === window.YT.PlayerState.PLAYING) {
                  setDuration(event.target.getDuration());
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch(e) {}
      }
    };
  }, [videoId]);

  // Time tracking loop
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;
    
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 100); // Update more frequently for smoother slider

    return () => clearInterval(interval);
  }, [isPlaying, onTimeUpdate]);

  const togglePlay = () => {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
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

  const toggleMute = () => {
      if (!playerRef.current) return;
      if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
      } else {
          playerRef.current.mute();
          setIsMuted(true);
      }
  };

  const skip = (seconds: number) => {
      if (!playerRef.current) return;
      const newTime = Math.min(Math.max(currentTime + seconds, 0), duration);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
        className={cn("group relative rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Container */}
      <div className="aspect-video w-full relative">
         <div ref={containerRef} className="w-full h-full" />
         {!isReady && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500">
                 <Loader2 className="w-8 h-8 animate-spin" />
             </div>
         )}
      </div>

      {/* Controls Overlay */}
      <div 
        className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 flex flex-col gap-2",
            isHovered || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
         {/* Progress Bar */}
         <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
             <span>{formatTime(currentTime)}</span>
             <div className="flex-1 relative h-1 bg-white/20 rounded-full group/slider cursor-pointer">
                 <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none" 
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                 />
                 {/* Thumb Indicator */}
                 <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity"
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                 />
             </div>
             <span>{formatTime(duration)}</span>
         </div>

         {/* Main Controls */}
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <button onClick={() => skip(-10)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                     <SkipBack className="w-4 h-4" />
                 </button>
                 
                 <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20">
                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                 </button>
                 
                 <button onClick={() => skip(10)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                     <SkipForward className="w-4 h-4" />
                 </button>
             </div>

             <div className="flex items-center gap-2 group/volume">
                 <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                     {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                 </button>
                 <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
