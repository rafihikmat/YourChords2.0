
import React, { useState, useRef, useEffect } from 'react';
import AIChordForm from '../components/AIChordForm';
import SongUploader from '../components/SongUploader';
import ChordDiagram from '../components/ChordDiagram';
import { CHORD_FAMILIES, normalizeChordName } from '../lib/musicUtils';
import { Sparkles, Upload, Activity, Book, Play, Mic2, Pause, Send, GraduationCap, Lightbulb, Info, Search } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { useAuth } from '../contexts/AuthContext';
import { ai } from '../lib/gemini';
import { useMetronome } from '../lib/hooks';

const ToolsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'tuner' | 'library' | 'metronome' | 'assistant'>('tuner');
  const tunerAudioContextRef = useRef<AudioContext | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const { isPlaying: isMetroPlaying, setIsPlaying: setIsMetroPlaying, bpm, setBpm } = useMetronome(120);
  
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const [chordSearchTerm, setChordSearchTerm] = useState('');
  const [searchedChord, setSearchedChord] = useState<string | null>(null);

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
          if (tunerAudioContextRef.current.state !== 'closed') tunerAudioContextRef.current.close().catch(() => {});
          tunerAudioContextRef.current = null;
      }
      setActiveNote(null);
  };
  
  const handleAssistantSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assistantQuery.trim()) return;
      setIsAssistantLoading(true);
      try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a friendly and expert Guitar Learning Assistant. 
            The user is asking: "${assistantQuery}"
            Provide a concise, helpful, and encouraging answer.`
          });
          setAssistantResponse(response.text || "I couldn't tune into that frequency. Try asking again.");
      } catch (error) {
          setAssistantResponse("Connection interrupted. Please check your neural link (internet/API key).");
      } finally {
          setIsAssistantLoading(false);
      }
  };

  const handleChordSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chordSearchTerm) return;
      const normalized = normalizeChordName(chordSearchTerm);
      setSearchedChord(normalized);
  };

  useEffect(() => {
      return () => { stopNote(); };
  }, []);

  const GUITAR_STRINGS = [
      { note: 'E2', freq: 82.41 }, { note: 'A2', freq: 110.00 }, { note: 'D3', freq: 146.83 },
      { note: 'G3', freq: 196.00 }, { note: 'B3', freq: 246.94 }, { note: 'E4', freq: 329.63 },
  ];

  const tabs = [
      { id: 'tuner', label: 'Guitar Tuner', icon: Activity, visible: true },
      { id: 'metronome', label: 'Metronome', icon: Mic2, visible: true },
      { id: 'library', label: 'Chord Visualizer', icon: Book, visible: true },
      { id: 'assistant', label: 'AI Assistant', icon: GraduationCap, visible: true },
      { id: 'upload', label: 'Upload', icon: Upload, visible: true },
      { id: 'ai', label: 'AI Generator', icon: Sparkles, visible: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden">
       <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary mb-4"><Sparkles className="w-3 h-3" /> Musician's Toolkit</div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Tools & Utilities</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Generate chords, tune your guitar, visualize diagrams, or ask the AI for help.</p>
        </div>

        <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm min-w-max">
                {tabs.filter(t => t.visible).map((tab) => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); stopNote(); setIsMetroPlaying(false); }} className={cn("flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === tab.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}>
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-center gap-2"><Activity className="w-6 h-6 text-primary" /> Standard Tuning (E A D G B E)</h2>
                    <p className="text-slate-500 mb-8">Click a string to play a reference tone.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {GUITAR_STRINGS.map((s) => (
                            <button key={s.note} onClick={() => playNote(s.freq, s.note)} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 relative overflow-hidden", activeNote === s.note ? "bg-primary text-white border-primary shadow-lg shadow-primary/50" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-primary/50")}>
                                <span className="text-2xl font-black mb-2">{s.note.charAt(0)}</span>
                                <span className="text-xs font-mono opacity-70">{s.freq}Hz</span>
                                {activeNote === s.note && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'metronome' && (
             <div className="w-full max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-12 shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center justify-center gap-2"><Mic2 className="w-6 h-6 text-primary" /> Metronome</h2>
                    <div className="mb-10"><div className="text-6xl font-black text-slate-900 dark:text-white mb-2 font-mono">{bpm}</div><div className="text-slate-500 uppercase tracking-widest text-sm">Beats Per Minute</div></div>
                    <div className="flex items-center justify-center gap-8 mb-10">
                         <button onClick={() => setBpm(prev => Math.max(40, prev - 5))} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-xl font-bold text-slate-500">-</button>
                         <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-64 accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                         <button onClick={() => setBpm(prev => Math.min(240, prev + 5))} className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-xl font-bold text-slate-500">+</button>
                    </div>
                    <button onClick={() => setIsMetroPlaying(!isMetroPlaying)} className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 mx-auto", isMetroPlaying ? "bg-primary text-white animate-pulse shadow-primary/50" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white")}>
                        {isMetroPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                </div>
             </div>
        )}

        {activeTab === 'library' && (
             <div className="w-full mx-auto space-y-8">
                 <div className="text-center mb-4"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chord Diagram Visualizer</h2><p className="text-slate-500 text-sm">Comprehensive dictionary organized by family.</p></div>
                 <div className="max-w-md mx-auto mb-10">
                    <form onSubmit={handleChordSearch} className="relative">
                        <input type="text" value={chordSearchTerm} onChange={(e) => setChordSearchTerm(e.target.value)} placeholder="Enter chord name (e.g., C, Am, G7, F#m)" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-4 text-sm shadow-lg focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white" />
                        <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                        <button type="submit" className="absolute right-2 top-2 p-1.5 bg-primary rounded-full text-white hover:bg-primary/90"><Search className="w-3 h-3" /></button>
                    </form>
                    {searchedChord && (
                        <div className="mt-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-primary/30 shadow-xl shadow-primary/10"><h3 className="text-sm font-bold text-center mb-4 text-primary">Search Result: {searchedChord}</h3><div className="transform scale-125 mb-2"><ChordDiagram name={searchedChord} /></div></div>
                            <button onClick={() => {setSearchedChord(null); setChordSearchTerm('');}} className="mt-4 text-xs text-slate-500 hover:text-white">Clear Search</button>
                        </div>
                    )}
                 </div>
                 {Object.entries(CHORD_FAMILIES).map(([family, chords]) => (
                     <div key={family} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-lg">
                         <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/5 pb-2"><div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Book className="w-4 h-4" /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{family} Chords</h3></div>
                         <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                             {chords.map(chord => (<div key={chord} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-md group cursor-pointer" onClick={() => {setSearchedChord(chord); window.scrollTo({top:0, behavior:'smooth'})}}><ChordDiagram name={chord} /></div>))}
                         </div>
                     </div>
                 ))}
             </div>
        )}
        
        {activeTab === 'assistant' && (
             <div className="w-full max-w-3xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-1 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-8 pb-12 text-center"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> AI Chord Learning Assistant</h2><p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-sm">Ask me anything about how to play a chord, transitioning tips, or basic theory.</p></div>
                    <div className="-mt-6 px-6 pb-6">
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-lg">
                             <div className="mb-6 min-h-[100px]">
                                 {assistantResponse ? (
                                     <div className="flex gap-4 animate-in fade-in"><div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-white" /></div><div className="bg-white dark:bg-slate-900 p-4 rounded-xl rounded-tl-none border border-slate-200 dark:border-white/10 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{assistantResponse}</div></div>
                                 ) : (
                                     <div className="text-center text-slate-400 py-8 flex flex-col items-center gap-2"><Lightbulb className="w-8 h-8 text-yellow-500/50" /><p className="text-sm">"How do I play an F barre chord?"</p><p className="text-xs opacity-50">"What's the difference between C and Cadd9?"</p></div>
                                 )}
                             </div>
                             <form onSubmit={handleAssistantSubmit} className="relative">
                                 <input type="text" value={assistantQuery} onChange={(e) => setAssistantQuery(e.target.value)} placeholder="Ask a question about chords or guitar..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none shadow-inner" />
                                 <button type="submit" disabled={isAssistantLoading || !assistantQuery.trim()} className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                                     {isAssistantLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                 </button>
                             </form>
                        </div>
                    </div>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
