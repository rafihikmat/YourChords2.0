
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import { Song } from '../types';
import { Play, Pause, User, Music, ArrowLeft, FileText, Sliders, Minus, Plus, Type, Mic2, Book, Gauge, Clock, FastForward, X } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TablatureView from '../components/TablatureView';
import { transposeChord, CHORD_DATA } from '../lib/musicUtils';
import ChordDiagram from '../components/ChordDiagram';

// Mock data for fallback
const MOCK_SONGS: Record<string, Song> = {
  '11111111-1111-1111-1111-111111111111': {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Neon Blade',
    artist: 'MoonDeity',
    difficulty: 'Expert',
    view_count: 125000,
    spotify_track_id: '6GkfiUZcrV4rYeArp4vEbe',
    youtube_video_id: 'YzVdD2s-6bM',
    chords: [
        { line: "[Intro]", chords: [] },
        { line: "Bm  G  D  A", chords: ["Bm", "G", "D", "A"] },
        { line: "Silent shadows dancing on the wall", chords: ["Bm", "G"] },
        { line: "Cybernetic dreams begin to fall", chords: ["D", "A"] }
    ],
    tablature: null
  },
  '22222222-2222-2222-2222-222222222222': {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'After Dark',
    artist: 'Mr. Kitty',
    difficulty: 'Medium',
    view_count: 89000,
    spotify_track_id: '2LKOHdMsL0K9KwcPRlJK2v',
    youtube_video_id: 'waAlgFq9Xq8',
    chords: [
        { line: "I see you", chords: ["Am"] },
        { line: "You see me", chords: ["F"] },
        { line: "How pleasant", chords: ["C"] },
        { line: "This feeling", chords: ["G"] }
    ],
    tablature: null
  }
};

const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Features State ---
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0); // Default 1.0x
  const [isScrollMenuOpen, setIsScrollMenuOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isWidgetHovered, setIsWidgetHovered] = useState(false);
  
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [fontSize, setFontSize] = useState(16); // px
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [bpm, setBpm] = useState(120);
  
  // Metronome Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        setError("Invalid Song ID format.");
        setLoading(false);
        return;
      }

      try {
        if (!MOCK_SONGS[id]) {
             await supabase.from('songs').select('view_count').eq('id', id).single()
                .then(({ data }) => {
                     if (data) supabase.from('songs').update({ view_count: data.view_count + 1 }).eq('id', id);
                });
        }

        const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();

        if (error) {
             if (MOCK_SONGS[id]) {
                 setSong(MOCK_SONGS[id]);
                 setError(null);
                 return;
             }
             throw error;
        }
        setSong(data as unknown as Song);
      } catch (err: any) {
        if (MOCK_SONGS[id!]) setSong(MOCK_SONGS[id!]);
        else setError("Song not found in the database.");
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  // Compact Header Logic
  useEffect(() => {
    const handleScroll = () => setIsHeaderCompact(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smart Auto-scroll Logic (RequestAnimationFrame)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
        if (!lastTime) lastTime = time;
        const delta = time - lastTime;
        
        if (isAutoScrolling) {
            // Base speed: 20px per second at 1.0x speed
            const basePixelsPerSecond = 20;
            
            const pixelsToScroll = (basePixelsPerSecond * scrollSpeed * delta) / 1000;
            
            if (pixelsToScroll > 0) {
                 window.scrollBy(0, pixelsToScroll);
                 lastTime = time;
            }
            
            // Stop at bottom
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
                setIsAutoScrolling(false);
            }
        }
        animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isAutoScrolling) {
        animationFrameId = requestAnimationFrame(animate);
    } else {
        lastTime = 0;
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollSpeed]);

  // Metronome Logic
  useEffect(() => {
    if (isMetronomeOn) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      nextNoteTimeRef.current = ctx.currentTime;
      scheduler();
    } else {
        if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }

    return () => {
      if (timerIDRef.current) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isMetronomeOn]);

  const scheduler = () => {
    const lookahead = 25.0; 
    const scheduleAheadTime = 0.1; 
    if (!audioContextRef.current) return;
    
    // Safety check if context was closed externally
    if (audioContextRef.current.state === 'closed') return;

    while (nextNoteTimeRef.current < (audioContextRef.current?.currentTime || 0) + scheduleAheadTime) {
      scheduleNote(nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  };

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
  };

  const scheduleNote = (time: number) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    
    osc.frequency.value = 1000; // High pitch beep
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
    // Automatically open menu if starting and closed, for better UX
    if (!isAutoScrolling && !isScrollMenuOpen) setIsScrollMenuOpen(true);
  };

  // Collect Unique Chords for Diagrams
  const uniqueChords = Array.from(new Set(
    song?.chords?.flatMap(line => line.chords?.map(c => transposeChord(c, transposeSteps)) || []) || []
  )).filter((chordName: unknown) => {
      return typeof chordName === 'string' && chordName.trim() !== '';
  });

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;
  if (error || !song) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white">{error}</div>;

  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    Hard: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Expert: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  const speedPresets = [0.5, 1.0, 1.5, 2.0, 3.0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-20 pb-40 relative transition-colors duration-300">
       <div className="absolute inset-0 pointer-events-none z-0 opacity-30 fixed" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      
      {/* Fixed Compact Header */}
      <AnimatePresence>
        {isHeaderCompact && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/10 shadow-sm h-16 flex items-center px-6 justify-between"
          >
             <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"><ArrowLeft className="w-5 h-5" /></Link>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-none">{song.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{song.artist}</p>
                </div>
             </div>
             <button onClick={toggleAutoScroll} className={cn("p-2 rounded-full transition-all", isAutoScrolling ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-white/10")}>
                {isAutoScrolling ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOPHISTICATED BOTTOM-RIGHT AUTO SCROLL WIDGET */}
      <AnimatePresence>
          <motion.div 
            className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
                scale: 1,
                opacity: isAutoScrolling || isScrollMenuOpen || isWidgetHovered ? 1 : 0.3
            }}
            transition={{ duration: 0.3 }}
            onHoverStart={() => setIsWidgetHovered(true)}
            onHoverEnd={() => setIsWidgetHovered(false)}
          >
             {/* Speed Popup Menu */}
             <AnimatePresence>
               {isScrollMenuOpen && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 mb-1 origin-bottom-right"
                 >
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 dark:border-white/10 mb-1">
                         <span className="text-[10px] font-bold uppercase text-slate-400">Scroll Speed</span>
                         <button onClick={() => setIsScrollMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-3 h-3" /></button>
                    </div>
                    {speedPresets.map(s => (
                       <button 
                         key={s} 
                         onClick={() => { 
                             setScrollSpeed(s); 
                             setIsAutoScrolling(true);
                             setIsScrollMenuOpen(false); // Auto close on selection
                         }}
                         className={cn(
                             "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-w-[100px]", 
                             scrollSpeed === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                         )}
                       >
                           <span>{s.toFixed(1)}x</span>
                           {scrollSpeed === s && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                       </button>
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Main Control Pill */}
             <div className="group flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-1.5 rounded-full shadow-2xl hover:shadow-primary/20 transition-all hover:scale-105">
                
                {/* Speed Toggle */}
                <button 
                   onClick={() => setIsScrollMenuOpen(!isScrollMenuOpen)}
                   className="w-10 h-10 rounded-full flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-300"
                   title="Adjust Speed"
                >
                   <Gauge className="w-4 h-4 mb-0.5 text-slate-400 dark:text-slate-500" />
                   <span className="text-[10px] font-bold">{scrollSpeed}x</span>
                </button>

                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

                {/* Play/Pause Button */}
                <button 
                   onClick={toggleAutoScroll}
                   className={cn(
                     "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ring-4 ring-transparent",
                     isAutoScrolling 
                       ? "bg-red-500 text-white shadow-red-500/30 hover:bg-red-600" 
                       : "bg-primary text-white shadow-primary/30 hover:bg-blue-600 hover:ring-primary/20"
                   )}
                >
                   {isAutoScrolling ? (
                        <Pause className="w-6 h-6 fill-current" />
                   ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                   )}
                </button>
             </div>
          </motion.div>
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {!isHeaderCompact && (
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Library
          </Link>
        )}

        {/* Top Toolbar (Simplified) */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Transpose */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Music className="w-4 h-4" /> Transpose</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setTransposeSteps(p => Math.max(p - 1, -11))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="font-mono font-bold w-8 text-center">{transposeSteps > 0 ? '+' + transposeSteps : transposeSteps}</span>
                    <button onClick={() => setTransposeSteps(p => Math.min(p + 1, 11))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                </div>
             </div>

             {/* Font Size */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Type className="w-4 h-4" /> Font Size</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setFontSize(p => Math.max(p - 2, 12))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="font-mono font-bold w-8 text-center">{fontSize}</span>
                    <button onClick={() => setFontSize(p => Math.min(p + 2, 32))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
        </div>

        {/* Song Title Section */}
        <div className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border", difficultyColors[song.difficulty] || "bg-slate-700")}>{song.difficulty}</span>
                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-full">
                     <Mic2 className="w-3 h-3" />
                     <span className="text-xs font-bold">{bpm} BPM</span>
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">{song.title}</h1>
            <div className="flex items-center gap-2 text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium"><User className="w-5 h-5" /> {song.artist}</div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                    <div className="relative bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 shadow-xl">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-white/5 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Music className="w-6 h-6 text-primary" /> Chords & Lyrics</h2>
                        </div>

                        {song.file_path && (
                             <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div><div className="text-sm font-bold text-blue-600 dark:text-blue-400">Original File Available</div></div>
                                </div>
                                <a href={`${supabaseUrl}/storage/v1/object/public/song-files/${song.file_path}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg">Download</a>
                             </div>
                        )}
                        
                        <div className="space-y-8 font-mono selection:bg-primary/30" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: `${fontSize}px` }}>
                            {song.chords && Array.isArray(song.chords) ? song.chords.map((section: any, idx: number) => (
                                <div key={idx} className="relative mb-8 group/line">
                                    <div className="min-h-[1.6em] mb-1.5 flex flex-wrap gap-x-4 font-bold select-none text-primary dark:text-[#60A5FA]">
                                        {section.chords?.length > 0 ? section.chords.map((chord: string, cIdx: number) => (
                                            <span key={cIdx} className="cursor-pointer hover:scale-110 transition-transform inline-block">{transposeChord(chord, transposeSteps)}</span>
                                        )) : <span className="opacity-0">.</span>}
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{section.line || " "}</div>
                                </div>
                            )) : <div className="text-slate-500 italic text-center">No chord chart available.</div>}
                        </div>
                    </div>
                </motion.div>

                {/* Related Chords / Diagrams */}
                {uniqueChords.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <Book className="w-5 h-5 text-primary" /> Chords Used
                        </h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {uniqueChords.map(chord => (
                                <div key={chord} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl">
                                     <ChordDiagram name={chord} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {song.tablature && <TablatureView tabs={song.tablature} />}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
                <div className="sticky top-24 space-y-8">
                    {song.spotify_track_id && (
                        <iframe src={`https://open.spotify.com/embed/track/${song.spotify_track_id}?theme=0`} width="100%" height="152" frameBorder="0" allow="encrypted-media" className="rounded-xl shadow-lg"></iframe>
                    )}
                    {song.youtube_video_id && (
                         <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${song.youtube_video_id}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                         </div>
                    )}
                    
                    {/* Metronome in Sidebar for easy access */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                         <h4 className="font-bold mb-4 flex items-center gap-2"><Mic2 className="w-4 h-4 text-primary" /> Metronome</h4>
                         <div className="flex items-center justify-between gap-4">
                             <button onClick={() => setIsMetronomeOn(!isMetronomeOn)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", isMetronomeOn ? "bg-primary text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                                 {isMetronomeOn ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                             </button>
                             <div className="flex-1">
                                 <div className="flex justify-between text-xs mb-2">
                                     <span>Tempo</span>
                                     <span className="font-bold">{bpm} BPM</span>
                                 </div>
                                 <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
