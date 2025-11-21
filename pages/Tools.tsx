
import React, { useState, useRef, useEffect } from 'react';
import AIChordForm from '../components/AIChordForm';
import SongUploader from '../components/SongUploader';
import ChordDiagram from '../components/ChordDiagram';
import { CHORD_DATA } from '../lib/musicUtils';
import { Sparkles, Upload, Activity, Book, Play, Mic2, Pause } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { useAuth } from '../contexts/AuthContext';

const ToolsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'tuner' | 'library' | 'metronome'>('tuner');
  
  // Tuner State
  const tunerAudioContextRef = useRef<AudioContext | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Metronome State
  const [isMetroPlaying, setIsMetroPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const metroAudioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);

  // --- Tuner Logic ---
  const playNote = (frequency: number, note: string) => {
      if (activeNote === note) {
          stopNote();
          return;
      }
      stopNote();
      setActiveNote(note);

      tunerAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = tunerAudioContextRef.current.createOscillator();
      const gain = tunerAudioContextRef.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(tunerAudioContextRef.current.destination);
      osc.start();
  };

  const stopNote = () => {
      if (tunerAudioContextRef.current) {
          if (tunerAudioContextRef.current.state !== 'closed') {
            tunerAudioContextRef.current.close().catch(() => {});
          }
          tunerAudioContextRef.current = null;
      }
      setActiveNote(null);
  };

  // --- Metronome Logic ---
  useEffect(() => {
    if (isMetroPlaying) {
      if (!metroAudioContextRef.current) {
          metroAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      nextNoteTimeRef.current = metroAudioContextRef.current.currentTime;
      scheduler();
    } else {
      if (timerIDRef.current) {
          window.clearTimeout(timerIDRef.current);
          timerIDRef.current = null;
      }
    }
    // Cleanup handled by separate effect or component unmount generally, 
    // but here we persist logic while on tab unless component unmounts
    return () => {
        if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    };
  }, [isMetroPlaying]);

  const scheduler = () => {
      const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
      const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)

      if (!metroAudioContextRef.current) return;

      while (nextNoteTimeRef.current < metroAudioContextRef.current.currentTime + scheduleAheadTime) {
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
      if (!metroAudioContextRef.current) return;
      const osc = metroAudioContextRef.current.createOscillator();
      const gain = metroAudioContextRef.current.createGain();
      
      osc.frequency.value = 1000; // Click sound pitch
      osc.connect(gain);
      gain.connect(metroAudioContextRef.current.destination);
      
      osc.start(time);
      osc.stop(time + 0.05);
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          stopNote();
          if (metroAudioContextRef.current && metroAudioContextRef.current.state !== 'closed') {
              metroAudioContextRef.current.close().catch(() => {});
          }
      };
  }, []);

  const GUITAR_STRINGS = [
      { note: 'E2', freq: 82.41 },
      { note: 'A2', freq: 110.00 },
      { note: 'D3', freq: 146.83 },
      { note: 'G3', freq: 196.00 },
      { note: 'B3', freq: 246.94 },
      { note: 'E4', freq: 329.63 },
  ];

  const tabs = [
      { id: 'tuner', label: 'Guitar Tuner', icon: Activity, visible: true },
      { id: 'metronome', label: 'Metronome', icon: Mic2, visible: true },
      { id: 'library', label: 'Chord Library', icon: Book, visible: true },
      { id: 'upload', label: 'Upload', icon: Upload, visible: true },
      { id: 'ai', label: 'AI Generator', icon: Sparkles, visible: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden">
       <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary mb-4">
                <Sparkles className="w-3 h-3" /> Musician's Toolkit
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Tools & Utilities</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Generate chords, tune your guitar, browse fingerings, or upload your own files.
            </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm min-w-max">
                {tabs.filter(t => t.visible).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            stopNote(); // Stop tuner if switching
                            setIsMetroPlaying(false); // Stop metronome if switching
                        }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === tab.id 
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'ai' && isAdmin && <AIChordForm />}
        {activeTab === 'upload' && <SongUploader />}
        
        {activeTab === 'tuner' && (
             <div className="w-full max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-center gap-2">
                        <Activity className="w-6 h-6 text-primary" /> Standard Tuning (E A D G B E)
                    </h2>
                    <p className="text-slate-500 mb-8">Click a string to play a reference tone.</p>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {GUITAR_STRINGS.map((s) => (
                            <button
                                key={s.note}
                                onClick={() => playNote(s.freq, s.note)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 relative overflow-hidden",
                                    activeNote === s.note 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/50" 
                                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-primary/50"
                                )}
                            >
                                <span className="text-2xl font-black mb-2">{s.note.charAt(0)}</span>
                                <span className="text-xs font-mono opacity-70">{s.freq}Hz</span>
                                {activeNote === s.note && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'metronome' && (
             <div className="w-full max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-12 shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center justify-center gap-2">
                        <Mic2 className="w-6 h-6 text-primary" /> Metronome
                    </h2>
                    
                    <div className="mb-10">
                        <div className="text-6xl font-black text-slate-900 dark:text-white mb-2 font-mono">{bpm}</div>
                        <div className="text-slate-500 uppercase tracking-widest text-sm">Beats Per Minute</div>
                    </div>

                    <div className="flex items-center justify-center gap-8 mb-10">
                         <button onClick={() => setBpm(prev => Math.max(40, prev - 5))} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-xl font-bold text-slate-500">-</button>
                         <input 
                            type="range" 
                            min="40" 
                            max="240" 
                            value={bpm} 
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="w-64 accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                         />
                         <button onClick={() => setBpm(prev => Math.min(240, prev + 5))} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-xl font-bold text-slate-500">+</button>
                    </div>

                    <button 
                        onClick={() => setIsMetroPlaying(!isMetroPlaying)}
                        className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 mx-auto",
                            isMetroPlaying ? "bg-primary text-white animate-pulse shadow-primary/50" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        )}
                    >
                        {isMetroPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                </div>
             </div>
        )}

        {activeTab === 'library' && (
             <div className="w-full mx-auto">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Book className="w-6 h-6 text-primary" /> Chord Dictionary
                     </h2>
                     <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                         {Object.keys(CHORD_DATA).map(chord => (
                             <div key={chord} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                 <ChordDiagram name={chord} />
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        )}
        
      </div>
    </div>
  );
};

export default ToolsPage;
