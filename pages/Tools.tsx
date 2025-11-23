
import React, { useState, useRef, useEffect } from 'react';
import AIChordForm from '../components/AIChordForm';
import SongUploader from '../components/SongUploader';
import ChordDiagram from '../components/ChordDiagram';
import { CHORD_FAMILIES, normalizeChordName } from '../lib/musicUtils';
import { Sparkles, Upload, Activity, Book, Play, Mic2, Pause, Send, GraduationCap, Lightbulb, Search } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { useAuth } from '../contexts/AuthContext';
import { ai } from '../lib/gemini';
import { useMetronome } from '../lib/hooks';

const ToolsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'tuner' | 'library' | 'metronome' | 'assistant'>('tuner');
  
  // Tuner State
  const tunerCtx = useRef<AudioContext | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  
  // Metronome
  const { isPlaying: isMetroPlaying, setIsPlaying: setIsMetroPlaying, bpm, setBpm } = useMetronome(120);
  
  // Assistant
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Search
  const [chordSearchTerm, setChordSearchTerm] = useState('');
  const [searchedChord, setSearchedChord] = useState<string | null>(null);

  useEffect(() => {
      return () => { if(tunerCtx.current) tunerCtx.current.close(); };
  }, []);

  const playNote = (frequency: number, note: string) => {
      if (activeNote === note) return stopNote();
      stopNote();
      setActiveNote(note);
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      tunerCtx.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
  };

  const stopNote = () => {
      if (tunerCtx.current) {
          tunerCtx.current.close().catch(() => {});
          tunerCtx.current = null;
      }
      setActiveNote(null);
  };
  
  const handleAssistantSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assistantQuery.trim()) return;
      setIsAssistantLoading(true);
      try {
          // System Instruction: Music Professor Persona
          const prompt = `
            You are "Prof. Harmony", an elite Music Professor and Multi-instrumentalist Expert.
            
            Your Mission: Act as a comprehensive academic mentor for music students and musicians.
            
            Your 5 Pillars of Expertise:
            1. Music Theory & Analysis (Harmony, Counterpoint, Modes, Jazz Theory, Voice Leading)
            2. History & Musicology (Baroque to Modern, Ethnomusicology, Genre Evolution)
            3. Composition & Arrangement (Songwriting structures, Orchestration, Motif development)
            4. Music Production & Technology (Mixing, Mastering, DAW workflows, Sound Design, Acoustics)
            5. Music Pedagogy (Effective practice techniques, learning strategies, sight-reading)

            Tone: Professional, academic yet accessible, encouraging, and highly detailed. Use analogies where helpful.
            
            User Question: "${assistantQuery}"
            
            Provide a clear, structured answer. If the question implies a need for a practical example (like a chord progression, scale pattern, or EQ setting), provide it clearly.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
          setAssistantResponse(response.text || "I couldn't analyze that musical concept right now.");
      } catch (error) {
          setAssistantResponse("Neural Link Interrupted. Please check your connection.");
      } finally {
          setIsAssistantLoading(false);
      }
  };

  const handleChordSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (chordSearchTerm) setSearchedChord(normalizeChordName(chordSearchTerm));
  };

  const GUITAR_STRINGS = [
      { note: 'E2', freq: 82.41 }, { note: 'A2', freq: 110.00 }, { note: 'D3', freq: 146.83 },
      { note: 'G3', freq: 196.00 }, { note: 'B3', freq: 246.94 }, { note: 'E4', freq: 329.63 },
  ];

  // Updated: AI Generator is available to everyone. Upload is restricted to Admin/User logic in component.
  const tabs = [
      { id: 'tuner', label: 'Guitar Tuner', icon: Activity, show: true },
      { id: 'metronome', label: 'Metronome', icon: Mic2, show: true },
      { id: 'library', label: 'Chord Visualizer', icon: Book, show: true },
      { id: 'assistant', label: 'Professor AI', icon: GraduationCap, show: true },
      { id: 'ai', label: 'AI Generator', icon: Sparkles, show: true },
      { id: 'upload', label: 'Upload File', icon: Upload, show: true }, // Logic handled inside component
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden">
       <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Tools & Utilities</h1>
            <p className="text-slate-600 dark:text-slate-400">Musician's Toolkit: Tuner, Metronome, and AI Research.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm min-w-max">
                {tabs.filter(t => t.show).map((tab) => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); stopNote(); setIsMetroPlaying(false); }} className={cn("flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === tab.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* View Content */}
        {activeTab === 'ai' && <AIChordForm />}
        {activeTab === 'upload' && (
            isAdmin ? <SongUploader /> : (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold dark:text-white">Admin Access Required</h3>
                    <p className="text-slate-500 mt-2">Only administrators can upload persistent files to the database.</p>
                </div>
            )
        )}
        
        {activeTab === 'tuner' && (
             <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl text-center">
                <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center justify-center gap-2"><Activity className="w-6 h-6 text-primary" /> Standard Tuning</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {GUITAR_STRINGS.map((s) => (
                        <button key={s.note} onClick={() => playNote(s.freq, s.note)} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 relative overflow-hidden", activeNote === s.note ? "bg-primary text-white border-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10")}>
                            <span className="text-2xl font-black mb-2">{s.note.charAt(0)}</span>
                            <span className="text-xs opacity-70">{s.freq}Hz</span>
                            {activeNote === s.note && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                        </button>
                    ))}
                </div>
             </div>
        )}

        {activeTab === 'metronome' && (
             <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-12 shadow-xl text-center">
                <h2 className="text-2xl font-bold dark:text-white mb-8"><Mic2 className="w-6 h-6 text-primary inline mr-2" /> Metronome</h2>
                <div className="mb-10"><div className="text-6xl font-black dark:text-white mb-2 font-mono">{bpm}</div><div className="text-slate-500 text-sm">BPM</div></div>
                <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-64 accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mb-10" />
                <button onClick={() => setIsMetroPlaying(!isMetroPlaying)} className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-xl mx-auto transition-all", isMetroPlaying ? "bg-primary text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white")}>
                    {isMetroPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
             </div>
        )}

        {activeTab === 'library' && (
             <div className="w-full mx-auto space-y-8">
                 <form onSubmit={handleChordSearch} className="max-w-md mx-auto relative">
                    <input type="text" value={chordSearchTerm} onChange={(e) => setChordSearchTerm(e.target.value)} placeholder="Search Chord (e.g. C, Am)" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-4 text-sm shadow-lg focus:ring-2 focus:ring-primary/50 outline-none dark:text-white" />
                    <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                 </form>
                 {searchedChord && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-primary/30 shadow-xl"><h3 className="text-sm font-bold text-center mb-4 text-primary">{searchedChord}</h3><ChordDiagram name={searchedChord} className="scale-125" /></div>
                    </div>
                 )}
                 {Object.entries(CHORD_FAMILIES).map(([family, chords]) => (
                     <div key={family} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-lg">
                         <h3 className="text-lg font-bold dark:text-white uppercase tracking-wider mb-6 border-b border-slate-200 dark:border-white/5 pb-2">{family}</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                             {chords.map(chord => (<div key={chord} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/30 cursor-pointer hover:shadow-md" onClick={() => {setSearchedChord(chord); window.scrollTo({top:0, behavior:'smooth'})}}><ChordDiagram name={chord} /></div>))}
                         </div>
                     </div>
                 ))}
             </div>
        )}
        
        {activeTab === 'assistant' && (
             <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="bg-primary/10 p-8 text-center">
                    <h2 className="text-2xl font-bold dark:text-white flex items-center justify-center gap-2">
                        <GraduationCap className="w-6 h-6 text-primary" /> Professor Harmony AI
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                        Expert guidance on Theory, History, Composition, Production, and Pedagogy.
                    </p>
                </div>
                <div className="p-6">
                     <div className="mb-6 min-h-[100px] bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-white/10">
                         {assistantResponse ? (
                             <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                 {assistantResponse}
                             </div>
                         ) : (
                             <div className="text-center text-slate-400 py-4 flex flex-col items-center gap-4">
                                <Lightbulb className="w-6 h-6 opacity-50" />
                                <div className="space-y-2">
                                    <p className="text-xs italic">"Explain the Circle of Fifths and how to use it in Jazz."</p>
                                    <p className="text-xs italic">"What are the key characteristics of Baroque composition?"</p>
                                    <p className="text-xs italic">"How do I compress a vocal track properly?"</p>
                                    <p className="text-xs italic">"What is the history of the pentatonic scale?"</p>
                                </div>
                             </div>
                         )}
                     </div>
                     <form onSubmit={handleAssistantSubmit} className="relative">
                         <input type="text" value={assistantQuery} onChange={(e) => setAssistantQuery(e.target.value)} placeholder="Ask your professor..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none shadow-inner" />
                         <button type="submit" disabled={isAssistantLoading || !assistantQuery.trim()} className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                             {isAssistantLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                         </button>
                     </form>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
