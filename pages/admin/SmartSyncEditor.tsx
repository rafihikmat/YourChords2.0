
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Check, Copy, Video, Edit3, AlertCircle, PlayCircle, RotateCcw, Save, Download, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- Types ---
interface SyncLine {
  id: string;
  content: string;
  timeStart: number | null; // null = not synced yet
  type: 'header' | 'lyrics' | 'chords';
}

// --- Global YouTube API ---
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SmartSyncEditor: React.FC = () => {
  // --- State: Phases ---
  const [phase, setPhase] = useState<'setup' | 'sync'>('setup');

  // --- State: Data ---
  const [videoId, setVideoId] = useState('');
  const [rawText, setRawText] = useState('');
  const [lines, setLines] = useState<SyncLine[]>([]);
  
  // --- State: Player & Sync ---
  const [activeIndex, setActiveIndex] = useState<number>(0);
  // REMOVED: const [currentTime, setCurrentTime] = useState(0); // Performance Killer
  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- Refs ---
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);

  // --- Initialization: YouTube API ---
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // --- Initialization: Player (When switching to Sync phase) ---
  useEffect(() => {
    if (phase === 'sync' && videoId && window.YT) {
      setTimeout(() => {
        try {
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }

            new window.YT.Player('sync-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: { 'playsinline': 1, 'modestbranding': 1, 'rel': 0 },
                events: {
                    'onReady': (event: any) => { playerRef.current = event.target; },
                    'onStateChange': (event: any) => {
                        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
                    }
                }
            });
        } catch (e) {
            console.error("YouTube Init Error", e);
        }
      }, 200);
    }
  }, [phase, videoId]);

  // --- Loop: Track Time (Optimized) ---
  useEffect(() => {
    const loop = () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const t = playerRef.current.getCurrentTime();
            // Update DOM directly, bypassing React Render Cycle
            if (timeDisplayRef.current) {
                timeDisplayRef.current.innerText = t.toFixed(2) + 's';
            }
        }
        if (isPlaying) rafRef.current = requestAnimationFrame(loop);
    };

    if (phase === 'sync' && isPlaying) {
        rafRef.current = requestAnimationFrame(loop);
    } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, isPlaying]);

  // --- Effect: Auto-Scroll Active Line ---
  useEffect(() => {
      if (activeLineRef.current) {
          activeLineRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
          });
      }
  }, [activeIndex]);

  // --- Logic: Parser ---
  const handleParse = () => {
    if (!videoId) return alert("Enter a YouTube ID");
    if (!rawText) return alert("Paste lyrics/chords");

    const parsed: SyncLine[] = rawText.split('\n')
        .map((line, idx) => {
            const trimmed = line.trimEnd(); 
            if (!trimmed) return null;

            let type: SyncLine['type'] = 'lyrics';
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) type = 'header';
            else if (/^[A-G][#b]?(m|maj|dim|aug|sus|add|7|9|11|13)*(\/[A-G][#b]?)?(\s+[A-G][#b]?.+)*$/.test(trimmed) || trimmed.includes('   ')) {
                type = 'chords';
            }

            return {
                id: `line-${idx}`,
                content: trimmed,
                timeStart: null,
                type
            };
        })
        .filter(Boolean) as SyncLine[];

    setLines(parsed);
    setPhase('sync');
    setActiveIndex(0);
  };

  // --- Logic: Record Timestamp (The "Tap") ---
  const recordTimestamp = () => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    
    const time = playerRef.current.getCurrentTime();
    
    setLines(prev => {
        const newLines = [...prev];
        if (activeIndex < newLines.length) {
            newLines[activeIndex].timeStart = Number(time.toFixed(2));
        }
        return newLines;
    });

    // Advance
    if (activeIndex < lines.length - 1) {
        setActiveIndex(prev => prev + 1);
    }
  };

  // --- Interaction: Hotkey ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (phase === 'sync' && e.code === 'Space' && !e.repeat) {
              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                  e.preventDefault(); 
                  recordTimestamp();
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, activeIndex, lines]); 

  // --- Logic: Utils ---
  const seekTo = (time: number) => {
      if (playerRef.current && time !== null) {
          playerRef.current.seekTo(time, true);
          playerRef.current.playVideo();
      }
  };

  const updateTimestamp = (index: number, newVal: string) => {
      const num = parseFloat(newVal);
      setLines(prev => {
          const clone = [...prev];
          clone[index].timeStart = isNaN(num) ? null : num;
          return clone;
      });
  };

  const exportJson = () => {
      const output = {
          videoId,
          lines: lines.map(l => ({
              content: l.content,
              timeStart: l.timeStart || 0,
              type: l.type
          }))
      };
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
      alert("JSON copied to clipboard!");
  };

  // --- RENDER ---
  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col">
      
      {/* Header Toolbar */}
      <div className="h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                 <PlayCircle className="w-5 h-5" />
             </div>
             <h1 className="font-bold text-slate-900 dark:text-white">Studio Sync</h1>
             <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-xs font-mono text-slate-500">
                 {phase === 'setup' ? 'PHASE 1: SETUP' : 'PHASE 2: SYNCHRONIZATION'}
             </span>
         </div>

         {phase === 'sync' && (
             <div className="flex items-center gap-3">
                 <button onClick={() => setPhase('setup')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                     <RotateCcw className="w-4 h-4" /> Reset
                 </button>
                 <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
                 <button onClick={exportJson} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all active:scale-95">
                     <Download className="w-4 h-4" /> Export JSON
                 </button>
             </div>
         )}
      </div>

      {/* PHASE 1: SETUP */}
      {phase === 'setup' && (
          <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                  
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" /> Source Material
                      </h2>
                      
                      <div className="space-y-6">
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">YouTube Video ID</label>
                              <input 
                                  value={videoId}
                                  onChange={e => setVideoId(e.target.value)}
                                  placeholder="e.g. dQw4w9WgXcQ"
                                  className="w-full max-w-md px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Raw Lyrics & Chords</label>
                              <textarea 
                                  value={rawText}
                                  onChange={e => setRawText(e.target.value)}
                                  className="w-full h-96 px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm leading-relaxed resize-none"
                                  placeholder="[Verse 1]&#10;Am      F&#10;Paste your text here...&#10;C       G"
                              />
                              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> 
                                  Paste directly from Ultimate Guitar. Keep chords and lyrics on separate lines.
                              </p>
                          </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                          <button 
                              onClick={handleParse}
                              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                          >
                              Start Syncing <ChevronRight className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* PHASE 2: SYNC INTERFACE */}
      {phase === 'sync' && (
          <div className="flex-1 flex overflow-hidden">
              
              {/* LEFT: VIDEO & CONTROLS */}
              <div className="w-[400px] lg:w-[500px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 z-10 shadow-2xl">
                  <div className="aspect-video bg-black relative group shrink-0">
                      <div id="sync-player" className="w-full h-full"></div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col">
                      {/* Main Control Button */}
                      <button 
                          onClick={recordTimestamp}
                          className="w-full py-6 bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-2xl font-bold text-xl shadow-xl shadow-primary/20 transition-all flex flex-col items-center justify-center gap-1 mb-6 group"
                      >
                          <span className="flex items-center gap-2">
                              MARK TIME <Clock className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-normal opacity-80 bg-white/20 px-2 py-0.5 rounded">PRESS SPACEBAR</span>
                      </button>

                      <div className="space-y-4 mb-auto">
                          <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Current Time</span>
                              <span ref={timeDisplayRef} className="font-mono font-bold text-2xl text-slate-900 dark:text-white">
                                  0.00s
                              </span>
                          </div>
                          <div className="h-px bg-slate-200 dark:bg-white/10"></div>
                          <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Next Line</span>
                              <span className="font-mono font-bold text-primary">
                                  #{activeIndex + 2}
                              </span>
                          </div>
                      </div>

                      {/* Playback Controls */}
                      <div className="grid grid-cols-2 gap-3 mt-6">
                          <button onClick={() => playerRef.current?.playVideo()} className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
                              <Play className="w-4 h-4" /> Play
                          </button>
                          <button onClick={() => playerRef.current?.pauseVideo()} className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
                              <Pause className="w-4 h-4" /> Pause
                          </button>
                      </div>
                  </div>
              </div>

              {/* RIGHT: LINE LIST */}
              <div className="flex-1 bg-slate-50 dark:bg-[#0B1120] overflow-y-auto relative" ref={listContainerRef}>
                  <div className="max-w-3xl mx-auto min-h-full p-8 pb-[40vh]">
                      {lines.map((line, idx) => {
                          const isActive = idx === activeIndex;
                          const isDone = line.timeStart !== null;

                          return (
                              <div 
                                  key={line.id}
                                  ref={isActive ? activeLineRef : null}
                                  className={cn(
                                      "group relative flex items-start gap-4 p-4 rounded-xl mb-2 transition-all border-l-4",
                                      isActive 
                                          ? "bg-white dark:bg-slate-800 shadow-lg scale-105 border-primary z-10" 
                                          : isDone
                                              ? "bg-white/50 dark:bg-slate-900/50 border-green-500/30 opacity-70 hover:opacity-100"
                                              : "bg-transparent border-transparent opacity-40"
                                  )}
                              >
                                  {/* Status Icon */}
                                  <div className="mt-1 shrink-0">
                                      {isActive ? (
                                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
                                              <div className="w-2 h-2 bg-white rounded-full"></div>
                                          </div>
                                      ) : isDone ? (
                                          <button onClick={() => seekTo(line.timeStart || 0)} className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors">
                                              <Play className="w-3 h-3 fill-current" />
                                          </button>
                                      ) : (
                                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700"></div>
                                      )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                          <span className={cn(
                                              "text-[10px] font-bold uppercase tracking-wider",
                                              line.type === 'header' ? "text-purple-500" : 
                                              line.type === 'chords' ? "text-blue-500" : "text-slate-400"
                                          )}>
                                              {line.type}
                                          </span>
                                          
                                          {/* Manual Edit Input */}
                                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Clock className="w-3 h-3 text-slate-400" />
                                              <input 
                                                  type="number" 
                                                  step="0.1"
                                                  value={line.timeStart ?? ''}
                                                  onChange={(e) => updateTimestamp(idx, e.target.value)}
                                                  placeholder="--"
                                                  className="w-16 bg-transparent border-b border-slate-300 dark:border-slate-600 text-right font-mono text-xs focus:border-primary outline-none text-slate-900 dark:text-white"
                                                  onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                                              />
                                              <span className="text-xs text-slate-500">s</span>
                                          </div>
                                      </div>
                                      
                                      <p 
                                          className={cn(
                                              "font-mono whitespace-pre-wrap text-lg leading-relaxed transition-colors cursor-pointer",
                                              isActive ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400",
                                              line.type === 'chords' && "text-primary dark:text-blue-400 font-bold"
                                          )}
                                          onClick={() => { setActiveIndex(idx); seekTo(line.timeStart || 0); }}
                                      >
                                          {line.content}
                                      </p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  
                  {/* Center Line Marker (Visual Aid) */}
                  <div className="fixed top-1/2 left-[400px] lg:left-[500px] right-0 h-px bg-red-500/10 pointer-events-none z-0 hidden md:block"></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SmartSyncEditor;
