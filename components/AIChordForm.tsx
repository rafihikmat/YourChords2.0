
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music, PenTool, AlertCircle, Save, Link as LinkIcon, BarChart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { AIChordFormData } from '../types';
import AudioRecorder from './AudioRecorder';
import { ai } from '../lib/gemini';

// Extend type locally if needed or rely on looseness
interface ExtendedFormData extends AIChordFormData {
    spotifyUrl?: string;
    youtubeUrl?: string;
    difficulty: string;
}

const AIChordForm: React.FC = () => {
  const [formData, setFormData] = useState<ExtendedFormData>({
    title: '',
    artist: '',
    lyrics: '',
    spotifyUrl: '',
    youtubeUrl: '',
    difficulty: 'Medium'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('chordFormDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.lyrics) {
            setFormData(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Autosave draft
  useEffect(() => {
    const handler = setTimeout(() => {
        if (formData.lyrics || formData.title || formData.artist) {
            localStorage.setItem('chordFormDraft', JSON.stringify(formData));
            setLastSaved(new Date());
        }
    }, 1000);
    return () => clearTimeout(handler);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');

    try {
      // 1. Construct Prompt for Gemini
      const prompt = `
        Analyze the song "${formData.title}" by "${formData.artist}".
        Lyrics:
        ${formData.lyrics}

        Context URLs (for reference only):
        Spotify: ${formData.spotifyUrl}
        YouTube: ${formData.youtubeUrl}

        Task:
        1. Place chords precisely over the lyrics.
        2. Return ONLY a valid JSON object with this structure:
        {
          "title": "${formData.title}",
          "artist": "${formData.artist}",
          "chords": [
            { "line": "Verse 1", "chords": [] },
            { "line": "I'm walking down the street", "chords": ["C", "Am"] } 
          ]
        }
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;

      // 2. Call Gemini Direct (Client Side)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || "{}";
      const cleanJson = text.replace(/```json|```/g, '').trim();
      
      let chordData;
      try {
          chordData = JSON.parse(cleanJson);
      } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          throw new Error("AI response was not valid JSON. Please try again.");
      }

      // 3. Extract IDs from URLs
      const spotifyId = formData.spotifyUrl ? (formData.spotifyUrl.split('track/')[1]?.split('?')[0] || null) : null;
      const youtubeId = formData.youtubeUrl ? (formData.youtubeUrl.split('v=')[1]?.split('&')[0] || null) : null;

      // 4. Save to Supabase (Library)
      // Manually use the selected difficulty, ignoring AI
      const { error: dbError } = await supabase.from('songs').insert([{
          title: chordData.title || formData.title,
          artist: chordData.artist || formData.artist,
          difficulty: formData.difficulty, 
          chords: chordData.chords,
          spotify_track_id: spotifyId,
          youtube_video_id: youtubeId,
          view_count: 0
      }]);

      if (dbError) throw dbError;

      setStatus('success');
      localStorage.removeItem('chordFormDraft');
      setFormData({ title: '', artist: '', lyrics: '', spotifyUrl: '', youtubeUrl: '', difficulty: 'Medium' });

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
      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10">
        {/* Glass Panel */}
        <div className="relative rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 md:p-8 overflow-hidden shadow-xl dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <div className="relative z-10 mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Chord Generator
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Paste lyrics, add links, and let Gemini 2.5 Flash transcribe chords accurately.
                    </p>
                </div>
                {lastSaved && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 opacity-70">
                        <Save className="w-3 h-3" />
                        Saved {lastSaved.toLocaleTimeString()}
                    </div>
                )}
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
                     <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Difficulty (Manual)</label>
                     <div className="relative">
                        <BarChart className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <select 
                            value={formData.difficulty}
                            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-8 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                        </select>
                     </div>
                </div>

                {/* URL Inputs for Higher Accuracy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Spotify URL (Optional)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-green-500" />
                            <input 
                                type="text"
                                value={formData.spotifyUrl}
                                onChange={(e) => setFormData({...formData, spotifyUrl: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                placeholder="https://open.spotify.com/..."
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">YouTube URL (Optional)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-red-500" />
                            <input 
                                type="text"
                                value={formData.youtubeUrl}
                                onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                placeholder="https://youtube.com/watch?v=..."
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
                                    Analyzing frequencies...
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
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 p-3 rounded-lg border border-green-200 dark:border-green-400/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Success! Song generated and added to Library.</span>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Processing failed. Please check your internet or API key.</span>
                    </div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default AIChordForm;
