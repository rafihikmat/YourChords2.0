
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music, PenTool, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { AIChordFormData } from '../types';
import AudioRecorder from './AudioRecorder';

const AIChordForm: React.FC = () => {
  const [formData, setFormData] = useState<AIChordFormData>({
    title: '',
    artist: '',
    lyrics: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');

    try {
      // Calls the 'generate-chords' Edge Function which proxies to Gemini API
      const { data, error } = await supabase.functions.invoke('generate-chords', {
        body: formData
      });

      if (error) throw error;

      setStatus('success');
      console.log('Generated Chords:', data);
    } catch (error) {
      console.error('Error generating chords:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscription = (text: string) => {
      setFormData(prev => ({ ...prev, lyrics: prev.lyrics + (prev.lyrics ? '\n' : '') + text }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        {/* Glass Panel */}
        <div className="relative rounded-2xl bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <div className="relative z-10 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Chord Generator
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Paste your lyrics, upload audio, and let Gemini 2.5 Flash transcribe the chords instantly.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Song Title</label>
                        <div className="relative">
                            <Music className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                placeholder="e.g., Neon Nights"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Artist</label>
                        <div className="relative">
                            <PenTool className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                required
                                value={formData.artist}
                                onChange={(e) => setFormData({...formData, artist: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                placeholder="e.g., Cyber Punk"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Lyrics</label>
                        <AudioRecorder onTranscriptionComplete={handleTranscription} />
                    </div>
                    <textarea 
                        required
                        value={formData.lyrics}
                        onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                        rows={6}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm font-mono text-slate-900 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all resize-none"
                        placeholder="Paste full lyrics here or record audio..."
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-3 px-4 transition-all hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] disabled:opacity-70"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-20 animate-shimmer bg-[length:200%_100%] transition-opacity" />
                        <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Analyzing frequency...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Chords
                                </>
                            )}
                        </span>
                    </button>
                </div>

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Success! Song added to library. Redirecting...</span>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Connection to Neural Core failed. Try again.</span>
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default AIChordForm;
