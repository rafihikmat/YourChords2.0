
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music, PenTool, AlertCircle, Save, Link as LinkIcon, BarChart, Cpu, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AIChordFormData } from '../types';
import AudioRecorder from './AudioRecorder';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChordSheetParser } from '../lib/hooks/useChordSheetParser';
import SongLyricsDisplay from './SongLyricsDisplay';
import { ai } from '../lib/gemini';

interface ExtendedFormData extends AIChordFormData {
    spotifyUrl?: string;
    youtubeUrl?: string;
    difficulty: string;
}

const AIChordForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
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
  const [statusMessage, setStatusMessage] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // State for User-Only Preview (Non-saving mode)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // Parse the generated result in real-time for the preview view
  // When parsing JSON from the AI, we need to handle it carefully in the hook
  const { html } = useChordSheetParser({ 
    songData: generatedResult ? generatedResult.chords : null 
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem('chordFormDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.lyrics) setFormData(prev => ({ ...prev, ...parsed }));
      } catch {
        // Ignore error
      }
    }
  }, []);

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
    setStatusMessage('');
    setGeneratedResult(null);

    try {
        const prompt = `
            Generate a song chord sheet in strict JSON format.
            Song Title: ${formData.title}
            Artist: ${formData.artist}
            Difficulty: ${formData.difficulty}
            Lyrics/Context: ${formData.lyrics}

            The Output MUST be a valid JSON object with this exact structure:
            {
                "title": "Song Title",
                "artist": "Artist Name",
                "difficulty": "Easy/Medium/Hard",
                "chords": [
                    { "line": "Lyric line 1", "chords": ["Am", "C"] },
                    { "line": "Lyric line 2", "chords": ["G", "D"] }
                ]
            }
            Ensure chords are placed correctly relative to the lyrics.
            Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }]
        });

        const responseText = result.response.text();
        // Clean up markdown if present
        const cleanJson = responseText.replace(/```json|```/g, '').trim();

        const chordData = JSON.parse(cleanJson);

        if (!chordData || !chordData.chords) throw new Error("AI returned invalid structure.");

        // --- BRANCHING LOGIC ---
        if (isAdmin) {
            // ADMIN: Save to Database
            const spotifyId = formData.spotifyUrl ? (formData.spotifyUrl.split('track/')[1]?.split('?')[0] || null) : null;
            const youtubeId = formData.youtubeUrl ? (formData.youtubeUrl.split('v=')[1]?.split('&')[0] || null) : null;

            const { data: insertedSong, error: dbError } = await supabase.from('songs').insert([{
                title: chordData.title || formData.title,
                artist: chordData.artist || formData.artist,
                difficulty: chordData.difficulty || formData.difficulty,
                chords: chordData.chords,
                spotify_track_id: spotifyId,
                youtube_video_id: youtubeId,
                view_count: 0
            }]).select().single();

            if (dbError) throw dbError;

            setStatus('success');
            setStatusMessage('Song generated and indexed successfully.');
            localStorage.removeItem('chordFormDraft');

            if (insertedSong) {
                setTimeout(() => navigate(`/song/${insertedSong.id}`), 1500);
            }
            setFormData({ title: '', artist: '', lyrics: '', spotifyUrl: '', youtubeUrl: '', difficulty: 'Medium' });

        } else {
            // USER: Show Local Preview Only
            setGeneratedResult({
                title: chordData.title || formData.title,
                artist: chordData.artist || formData.artist,
                chords: chordData.chords
            });
            setStatus('success');
            setStatusMessage('Song generated! Scroll down to play.');
        }

    } catch (error: unknown) {
      setStatus('error');
      if (error instanceof Error) {
        setStatusMessage(error.message || "Processing failed. Please check your connection.");
      } else {
        setStatusMessage("Processing failed. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscription = (text: string) => {
      setFormData(prev => ({ ...prev, lyrics: prev.lyrics + (prev.lyrics ? '\n' : '') + text }));
  };

  const resetForm = () => {
      setGeneratedResult(null);
      setFormData({ title: '', artist: '', lyrics: '', spotifyUrl: '', youtubeUrl: '', difficulty: 'Medium' });
      setStatus('idle');
  };

  // --- RENDER VIEW: GENERATED RESULT (User Only) ---
  if (generatedResult && !isAdmin) {
      return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-primary/20 shadow-2xl overflow-hidden relative">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{generatedResult.title}</h2>
                          <p className="text-primary font-medium">{generatedResult.artist}</p>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setGeneratedResult(null)} // Go back to edit
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                          >
                             Edit
                          </button>
                          <button 
                            onClick={resetForm}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                             <Sparkles className="w-4 h-4" /> New Song
                          </button>
                      </div>
                  </div>

                  {/* Warning Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20 px-6 py-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      <span><strong>Preview Mode:</strong> This song is available for your session only and has not been saved to the public library.</span>
                  </div>

                  {/* Content */}
                  <div className="p-8 bg-white dark:bg-[#0A0F1C] min-h-[400px]">
                       <SongLyricsDisplay html={html} />
                  </div>
              </div>
          </motion.div>
      );
  }

  // --- RENDER VIEW: FORM ---
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10">
        <div className="relative rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 md:p-8 overflow-hidden shadow-xl dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <div className="relative z-10 mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Cpu className="w-6 h-6 text-primary" />
                        Neural Chord Generator
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {isAdmin ? "Admin Mode: Output will be saved to Database." : "User Mode: Output is for personal practice only."}
                    </p>
                </div>
                {lastSaved && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 opacity-70">
                        <Save className="w-3 h-3" />
                        Draft {lastSaved.toLocaleTimeString()}
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
                     <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Difficulty (Estimate)</label>
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

                {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-primary uppercase">Admin: Spotify URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-green-500" />
                                <input 
                                    type="text"
                                    value={formData.spotifyUrl}
                                    onChange={(e) => setFormData({...formData, spotifyUrl: e.target.value})}
                                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-primary uppercase">Admin: YouTube URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-red-500" />
                                <input 
                                    type="text"
                                    value={formData.youtubeUrl}
                                    onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Lyrics / Text</label>
                        <AudioRecorder onTranscriptionComplete={handleTranscription} />
                    </div>
                    <textarea 
                        required
                        value={formData.lyrics}
                        onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                        rows={6}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm font-mono text-slate-900 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all resize-none"
                        placeholder="Paste lyrics or raw text here..."
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
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {isAdmin ? "Generate & Save to Library" : "Generate Preview"}
                                </>
                            )}
                        </span>
                    </button>
                </div>

                {status === 'success' && !isAdmin && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 p-3 rounded-lg border border-green-200 dark:border-green-400/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Success! Preview loaded below.</span>
                    </motion.div>
                )}
                
                {status === 'error' && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>{statusMessage}</span>
                    </motion.div>
                )}
            </form>
        </div>
      </div>
    </div>
  );
};

export default AIChordForm;
