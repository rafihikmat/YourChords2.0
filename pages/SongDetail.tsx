
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl } from '../lib/supabase';
import type { Song } from '../types';
import { Play, Pause, User, Music, ArrowLeft, FileText, Minus, Plus, Type, Mic2, Anchor, Printer, SearchX, AlertTriangle, Book, Gauge } from 'lucide-react';
import { DOT_GRID_SVG, cn, DIFFICULTY_COLORS } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TablatureView from '../components/TablatureView';
import { transposeChord, CHORD_DATA } from '../lib/musicUtils';
import ChordDiagram from '../components/ChordDiagram';
import YouTubePlayer from '../components/YouTubePlayer';
import { useMetronome } from '../lib/hooks';

export default function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);
  const [isScrollMenuOpen, setIsScrollMenuOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isWidgetHovered, setIsWidgetHovered] = useState(false);
  
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  
  const { isPlaying: isMetronomeOn, setIsPlaying: setIsMetronomeOn, bpm, setBpm } = useMetronome(120);
  
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) { setError("No Song ID provided."); setLoading(false); return; }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { setError("Invalid ID Format."); setLoading(false); return; }

      try {
        supabase.rpc('increment_view_count', { row_id: id }).catch(() => {
            supabase.from('songs').select('view_count').eq('id', id).single()
            .then(({ data }) => {
                if (data) supabase.from('songs').update({ view_count: data.view_count + 1 }).eq('id', id);
            });
        });

        const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) throw new Error("Song not found");
        setSong(data as unknown as Song);
      } catch (err: any) {
        setError("Song not found in the neural database.");
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setIsHeaderCompact(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const animate = (time: number) => {
        if (!lastTime) lastTime = time;
        const delta = time - lastTime;
        if (isAutoScrolling) {
            const pixelsToScroll = (20 * scrollSpeed * delta) / 1000;
            if (pixelsToScroll > 0) { window.scrollBy(0, pixelsToScroll); lastTime = time; }
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) setIsAutoScrolling(false);
        }
        animationFrameId = requestAnimationFrame(animate);
    };
    if (isAutoScrolling) animationFrameId = requestAnimationFrame(animate);
    else lastTime = 0;
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollSpeed]);

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
    if (!isAutoScrolling && !isScrollMenuOpen) setIsScrollMenuOpen(true);
  };

  const effectiveTranspose = transposeSteps - capoFret;
  const uniqueChords = Array.from(new Set(
    song?.chords?.flatMap(line => line.chords?.map(c => transposeChord(c, effectiveTranspose)) || []) || []
  )).filter((chordName: unknown) => typeof chordName === 'string' && chordName.trim() !== '');

  if (loading) return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
          <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center"><Music className="w-6 h-6 text-primary animate-pulse" /></div>
          </div>
          <p className="text-sm font-mono text-slate-500 animate-pulse">Decrypting Song Data...</p>
      </div>
  );

  if (error || !song) return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 text-center p-4">
          <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20"><SearchX className="w-12 h-12 text-red-500" /></div>
          <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">404 Data Not Found</h1><p className="text-slate-500 dark:text-slate-400 mt-2">{error || "The requested song frequency could not be located."}</p></div>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">Return to Base</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-20 pb-40 relative transition-colors duration-300 print:bg-white print:text-black print:pt-0 print:pb-0">
       <div className="absolute inset-0 pointer-events-none z-0 opacity-30 fixed no-print" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      
      <AnimatePresence>
        {selectedChord && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedChord(null)}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none"></div>
                    <div className="flex flex-col items-center justify-center py-4 relative z-10">
                         <div className="transform scale-125 origin-center my-4"><ChordDiagram name={selectedChord} /></div>
                         <div className="mt-6 flex gap-2 text-xs text-slate-400 font-mono"><span>{CHORD_DATA[selectedChord]?.map(f => f === -1 ? 'x' : f).join(' - ')}</span></div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHeaderCompact && (
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-40 border-b border-slate-200 dark:border-white/10 shadow-sm h-16 flex items-center px-6 justify-between no-print">
             <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"><ArrowLeft className="w-5 h-5" /></Link>
                <div><h3 className="font-bold text-slate-900 dark:text-white leading-none">{song.title}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{song.artist}</p></div>
             </div>
             <button onClick={toggleAutoScroll} className={cn("p-2 rounded-full transition-all", isAutoScrolling ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-white/10")}>
                {isAutoScrolling ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          <motion.div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 no-print" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: isAutoScrolling || isScrollMenuOpen || isWidgetHovered ? 1 : 0.3 }} onHoverStart={() => setIsWidgetHovered(true)} onHoverEnd={() => setIsWidgetHovered(false)}>
             <AnimatePresence>
               {isScrollMenuOpen && (
                 <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 mb-1 origin-bottom-right">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map(s => (
                       <button key={s} onClick={() => { setScrollSpeed(s); setIsAutoScrolling(true); setIsScrollMenuOpen(false); }} className={cn("flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-w-[100px]", scrollSpeed === s ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10")}>
                           <span>{s.toFixed(1)}x</span>
                       </button>
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>
             <div className="group flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-1.5 rounded-full shadow-2xl hover:shadow-primary/20 transition-all hover:scale-105">
                <button onClick={() => setIsScrollMenuOpen(!isScrollMenuOpen)} className="w-10 h-10 rounded-full flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-300">
                   <Gauge className="w-4 h-4 mb-0.5" /><span className="text-[10px] font-bold">{scrollSpeed}x</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button onClick={toggleAutoScroll} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg", isAutoScrolling ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-white hover:bg-blue-600")}>
                   {isAutoScrolling ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
             </div>
          </motion.div>
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {!isHeaderCompact && <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary mb-8 transition-colors group no-print"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Library</Link>}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Music className="w-4 h-4" /> Transpose</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setTransposeSteps(p => Math.max(p - 1, -11))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="font-mono font-bold w-8 text-center">{transposeSteps > 0 ? '+' + transposeSteps : transposeSteps}</span>
                    <button onClick={() => setTransposeSteps(p => Math.min(p + 1, 11))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Anchor className="w-4 h-4" /> Capo</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setCapoFret(p => Math.max(p - 1, 0))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="font-mono font-bold w-8 text-center">{capoFret === 0 ? '-' : capoFret}</span>
                    <button onClick={() => setCapoFret(p => Math.min(p + 1, 12))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Type className="w-4 h-4" /> Size</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setFontSize(p => Math.max(p - 2, 12))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="font-mono font-bold w-8 text-center">{fontSize}</span>
                    <button onClick={() => setFontSize(p => Math.min(p + 2, 32))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all text-slate-500 dark:text-white"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
             <button onClick={() => window.print()} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-slate-700 dark:text-white group">
                 <Printer className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" /> Export PDF
             </button>
        </div>

        <div className="mb-12 print:mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border", DIFFICULTY_COLORS[song.difficulty] || DIFFICULTY_COLORS['Medium'])}>{song.difficulty || 'Medium'}</span>
                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-full no-print">
                     <Mic2 className="w-3 h-3" /><span className="text-xs font-bold">{bpm} BPM</span>
                </div>
                {capoFret > 0 && <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full"><Anchor className="w-3 h-3" /><span className="text-xs font-bold">Capo {capoFret}</span></div>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 text-slate-900 dark:text-white print:text-black">{song.title}</h1>
            <div className="flex items-center gap-2 text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium print:text-slate-700"><User className="w-5 h-5" /> {song.artist}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                    <div className="relative bg-white/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 shadow-xl print:shadow-none print:border-none print:p-0">
                        {song.file_path && (
                             <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between no-print">
                                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-blue-600" /><div><div className="text-sm font-bold text-blue-600 dark:text-blue-400">File Attached</div></div></div>
                                <a href={`${supabaseUrl}/storage/v1/object/public/song-files/${song.file_path}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg">Download</a>
                             </div>
                        )}
                        <div className="space-y-8 font-mono selection:bg-primary/30 print:text-black" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: `${fontSize}px` }}>
                            {song.chords && Array.isArray(song.chords) && song.chords.length > 0 ? song.chords.map((section: any, idx: number) => (
                                <div key={idx} className="relative mb-8 group/line break-inside-avoid">
                                    <div className="min-h-[1.6em] mb-1.5 flex flex-wrap gap-x-4 font-bold select-none text-cyan-400 print:text-black print:font-extrabold">
                                        {section.chords?.length > 0 ? section.chords.map((chord: string, cIdx: number) => {
                                            const transposed = transposeChord(chord, effectiveTranspose);
                                            return <button key={cIdx} onClick={() => setSelectedChord(transposed)} className="hover:scale-110 hover:text-white hover:bg-cyan-500/20 rounded px-1 transition-all inline-block cursor-pointer">{transposed}</button>;
                                        }) : <span className="opacity-0">.</span>}
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap print:text-gray-800">{section.line || " "}</div>
                                </div>
                            )) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl"><AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" /><p className="text-slate-500">No chord data available for this track.</p></div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {uniqueChords.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl break-inside-avoid print:border print:shadow-none print:bg-white">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black"><Book className="w-5 h-5 text-primary print:text-black" /> Chords Used</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {uniqueChords.map(chord => (<div key={chord} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl print:border-slate-300 print:bg-white"><ChordDiagram name={chord} /></div>))}
                        </div>
                    </div>
                )}
                {song.tablature && <div className="no-print"><TablatureView tabs={song.tablature} /></div>}
            </div>

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
                                 <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
