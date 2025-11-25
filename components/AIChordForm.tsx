
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music, PenTool, AlertCircle, Save, Link as LinkIcon, BarChart, Cpu } from 'lucide-react';
import { AIChordFormData } from '../types';
import AudioRecorder from './AudioRecorder';
import { useChordSheetParser } from '../lib/hooks/useChordSheetParser';
import AIChordFormPreview from './AIChordFormPreview';
import { useAIChordGenerator } from '../lib/hooks/useAIChordGenerator';

/**
 * Extended form data interface including optional URLs and difficulty.
 */
interface ExtendedFormData extends AIChordFormData {
    spotifyUrl?: string;
    youtubeUrl?: string;
    difficulty: string;
}

/**
 * Component providing a form to generate chord sheets using AI (Gemini).
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
import AIChordFormPreview from './AIChordFormPreview';
import { useAIChordGenerator } from '../lib/hooks/useAIChordGenerator';

/**
 * Extended form data interface including optional URLs and difficulty.
 */
interface ExtendedFormData extends AIChordFormData {
    spotifyUrl?: string;
    youtubeUrl?: string;
    difficulty: string;
}

/**
 * Component providing a form to generate chord sheets using AI (Gemini).
 * Supports both admin (save to DB) and user (local preview) modes.
 * Features audio transcription for lyrics input.
 *
 * @returns {JSX.Element} The AIChordForm component.
 */
const AIChordForm: React.FC = () => {
    const {
        formData,
        setFormData,
        isLoading,
        status,
        statusMessage,
        lastSaved,
        generatedResult,
        setGeneratedResult,
        handleSubmit,
        handleTranscription,
        resetForm,
        isAdmin
    } = useAIChordGenerator();

    // Parse the generated result in real-time for the preview view
    const { html } = useChordSheetParser({
        songData: generatedResult ? generatedResult.chords : null
    });

    // --- RENDER VIEW: GENERATED RESULT (User Only) ---
    if (generatedResult && !isAdmin) {
        return (
            <AIChordFormPreview
                generatedResult={generatedResult}
                html={html}
                onEdit={() => setGeneratedResult(null)}
                onReset={resetForm}
            />
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
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
                                            onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
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
                                            onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
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
                                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
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
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 p-3 rounded-lg border border-green-200 dark:border-green-400/20">
                                <Sparkles className="w-3 h-3" />
                                <span>Success! Preview loaded below.</span>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">
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
