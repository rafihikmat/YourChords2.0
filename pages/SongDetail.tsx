
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import { Song } from '../types';
import { Play, Pause, User, Music, ArrowLeft, FileText, Minus, Plus, Type, Mic2, Anchor, Printer, SearchX, Book, Gauge } from 'lucide-react';
import { DOT_GRID_SVG, cn, DIFFICULTY_COLORS } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TablatureView from '../components/TablatureView';
import ChordDiagram from '../components/ChordDiagram';
import YouTubePlayer from '../components/YouTubePlayer';
import { useMetronome } from '../lib/hooks';
import { useChordSheetParser } from '../lib/hooks/useChordSheetParser';
import SongLyricsDisplay from '../components/SongLyricsDisplay';
import { getChordFingering } from '../lib/musicUtils';

/**
 * The Song Detail page component.
 * Displays the full chord sheet, lyrics, tablature, and media integration for a specific song.
 * Features:
 * - Transposition
 * - Auto-scrolling
 * - Chord diagrams (hover/click)
 * - Metronome
 * - PDF Export
 * - Spotify/YouTube embedding
 *
 * @returns {JSX.Element} The SongDetail component.
 */
export default function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View State
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);
  const [isScrollMenuOpen, setIsScrollMenuOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  
  // Music State
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  
  const { isPlaying: isMetronomeOn, setIsPlaying: setIsMetronomeOn, bpm, setBpm } = useMetronome(120);

  // --- Parser Hook ---
  // Safely extract source data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceData = (song?.tablature as any)?.content || song?.chords || null;
  
  const { html, uniqueChords } = useChordSheetParser({
    songData: sourceData,
    transposeSteps: transposeSteps - capoFret
  });

  // --- GHOST DIAGRAM FIX & CRASH PREVENTION ---
  const displayChords = useMemo(() => {
      let rawList: string[] = [];

      // 1. Priority: Use unique chords extracted by the parser (most accurate for ChordPro/AI content)
      if (uniqueChords && uniqueChords.length > 0) {
          rawList = uniqueChords;
      } 
      // 2. Fallback: Use DB 'chords' column if parser found nothing
      else if (Array.isArray(song?.chords)) {
          // CHECK DATA TYPE: ensure we are looking at an array of strings
          const chords = song.chords;
          
          if (chords.length > 0) {
              const firstItem = chords[0];
              
              if (typeof firstItem === 'string') {
                  // Legacy Format: ["C", "Am", "F"]
                  rawList = chords as unknown as string[];
              } else if (typeof firstItem === 'object' && firstItem !== null && 'chords' in firstItem) {
                  // AI/New Format: [{ line: "...", chords: ["C", "Am"] }]
                  // Flatten all chords from all lines
                  // @ts-expect-error - Validating structure at runtime
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  rawList = (chords as any[]).flatMap(line => Array.isArray(line.chords) ? line.chords : []);
              }
          }
      }

      // 3. Clean, Dedup, and Validate
      const validSet = new Set<string>();
      
      rawList.forEach(c => {
          if (!c || typeof c !== 'string') return;
          const clean = c.trim();
          // Verify against music utils to ensure it's a renderable chord (prevents lyrics appearing as chords)
          if (clean.length > 0 && clean.length < 10 && getChordFingering(clean) !== null) {
              validSet.add(clean);
          }
      });

      return Array.from(validSet);
  }, [uniqueChords, song?.chords]);

  useEffect(() => {
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { setError("Invalid Song ID"); setLoading(false); return; }
    
    const fetchSong = async () => {
      try {
        const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
        if (error || !data) throw new Error("Song not found");
        setSong(data as unknown as Song);
        // Fire & Forget View Count
        supabase.rpc('increment_view_count', { row_id: id });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Could not retrieve song data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  useEffect(() => {
    const onScroll = () => setIsHeaderCompact(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // --- Auto Scroll Loop ---
  useEffect(() => {
    if (!isAutoScrolling) return;
    let lastTime = 0;
    let rafId: number;

    const loop = (time: number) => {
        if (!lastTime) lastTime = time;
        const delta = time - lastTime;
        if (delta > 0) {
             window.scrollBy(0, (20 * scrollSpeed * delta) / 1000);
             lastTime = time;
        }
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) setIsAutoScrolling(false);
        else rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoScrolling, scrollSpeed]);

  if (loading) return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center animate-pulse gap-4">
          <Music className="w-12 h-12 text-primary" />
          <p className="text-slate-500 font-mono text-sm">Decrypting Frequency...</p>
      </div>
  );

  if (error || !song) return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <SearchX className="w-16 h-16 text-red-500 mb-4 opacity-80" />
          <h1 className="text-2xl font-bold dark:text-white mb-2">Signal Lost</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 transition-colors">Return to Base</button>
      </div>
  );

  const visibleTabs = song.tablature ? Object.fromEntries(Object.entries(song.tablature).filter(([k]) => k !== 'content')) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-20 pb-40 relative print:bg-white print:text-black print:pt-0">
      <div className="fixed inset-0 pointer-events-none opacity-30 no-print" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      
      {/* Chord Modal */}
      <AnimatePresence>
        {selectedChord && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedChord(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <ChordDiagram name={selectedChord} className="scale-150" />
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <AnimatePresence>
        {isHeaderCompact && (
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/10 h-16 flex items-center px-6 justify-between no-print shadow-lg">
             <div className="flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></Link>
                <div><h3 className="font-bold leading-none">{song.title}</h3><p className="text-xs text-slate-500">{song.artist}</p></div>
             </div>
             <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className={cn("p-2 rounded-full transition-all", isAutoScrolling ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-white/10")}>
                {isAutoScrolling ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Controls */}
      <motion.div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
         <AnimatePresence>
           {isScrollMenuOpen && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-2xl mb-2">
                {[0.5, 1.0, 1.5, 2.0].map(s => (
                   <button key={s} onClick={() => { setScrollSpeed(s); setIsAutoScrolling(true); setIsScrollMenuOpen(false); }} className={cn("flex w-full justify-between px-3 py-1.5 rounded-lg text-xs font-bold", scrollSpeed === s ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-white/10")}>
                       {s.toFixed(1)}x
                   </button>
                ))}
             </motion.div>
           )}
         </AnimatePresence>
         <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 rounded-full shadow-2xl">
            <button onClick={() => setIsScrollMenuOpen(!isScrollMenuOpen)} className="w-10 h-10 rounded-full flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5">
               <Gauge className="w-4 h-4 mb-0.5" /><span className="text-[9px] font-bold">{scrollSpeed}x</span>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
            <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95", isAutoScrolling ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-blue-600")}>
               <span className="text-white">{isAutoScrolling ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}</span>
            </button>
         </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {!isHeaderCompact && <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary mb-8 group no-print"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</Link>}

        {/* Toolbar */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
             {[
                 { label: 'Transpose', icon: Music, val: transposeSteps, set: setTransposeSteps, min: -11, max: 11, disp: (v: number) => v > 0 ? `+${v}` : v },
                 { label: 'Capo', icon: Anchor, val: capoFret, set: setCapoFret, min: 0, max: 12, disp: (v: number) => v === 0 ? '-' : v },
                 { label: 'Size', icon: Type, val: fontSize, set: setFontSize, min: 12, max: 32, disp: (v: number) => v }
             ].map((tool, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><tool.icon className="w-4 h-4" /> {tool.label}</span>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={() => tool.set(p => Math.max(p - (tool.label === 'Size' ? 2 : 1), tool.min))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                        <span className="font-mono font-bold w-8 text-center">{tool.disp(tool.val)}</span>
                        <button onClick={() => tool.set(p => Math.min(p + (tool.label === 'Size' ? 2 : 1), tool.max))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                 </div>
             ))}
             <button onClick={() => window.print()} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 <Printer className="w-5 h-5" /> Export PDF
             </button>
        </div>

        {/* Song Info */}
        <div className="mb-12 print:mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase border", DIFFICULTY_COLORS[song.difficulty] || DIFFICULTY_COLORS['Medium'])}>{song.difficulty}</span>
                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-full no-print"><Mic2 className="w-3 h-3" /><span className="text-xs font-bold">{bpm} BPM</span></div>
                {capoFret > 0 && <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full"><Anchor className="w-3 h-3" /><span className="text-xs font-bold">Capo {capoFret}</span></div>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 text-slate-900 dark:text-white">{song.title}</h1>
            <div className="flex items-center gap-2 text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium"><User className="w-5 h-5" /> {song.artist}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-10">
                {/* Lyrics & Chords */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 shadow-xl print:shadow-none print:border-none print:p-0">
                    {song.file_path && (
                         <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between no-print">
                            <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-blue-600" /><span className="text-sm font-bold text-blue-600 dark:text-blue-400">File Attached</span></div>
                            <a href={`${supabaseUrl}/storage/v1/object/public/song-files/${song.file_path}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg">Download</a>
                         </div>
                    )}
                    <SongLyricsDisplay html={html} fontSize={fontSize} onChordClick={setSelectedChord} />
                </motion.div>

                {/* Chord Palette */}
                {displayChords.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl break-inside-avoid print:bg-white print:border">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Book className="w-5 h-5 text-primary" /> Chords Used</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {displayChords.map(chord => (
                                <div key={chord} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedChord(chord)}>
                                    <ChordDiagram name={chord} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {visibleTabs && Object.keys(visibleTabs).length > 0 && <div className="no-print"><TablatureView tabs={visibleTabs} /></div>}
            </div>

            {/* Sidebar: Media & Metronome */}
            <div className="space-y-8 no-print">
                <div className="sticky top-24 space-y-8">
                    {song.spotify_track_id && <iframe src={`https://open.spotify.com/embed/track/${song.spotify_track_id}?theme=0`} width="100%" height="152" frameBorder="0" allow="encrypted-media" className="rounded-xl shadow-lg"></iframe>}
                    {song.youtube_video_id && <YouTubePlayer videoId={song.youtube_video_id} />}
                    
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                         <h4 className="font-bold mb-4 flex items-center gap-2"><Mic2 className="w-4 h-4 text-primary" /> Metronome</h4>
                         <div className="flex items-center justify-between gap-4">
                             <button onClick={() => setIsMetronomeOn(!isMetronomeOn)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", isMetronomeOn ? "bg-primary text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                                 {isMetronomeOn ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                             </button>
                             <div className="flex-1">
                                 <div className="flex justify-between text-xs mb-2"><span>Tempo</span><span className="font-bold">{bpm} BPM</span></div>
                                 <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
