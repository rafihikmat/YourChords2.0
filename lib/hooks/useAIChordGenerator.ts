import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ai } from '../gemini';
import { useAuth } from '../../contexts/AuthContext';
import { AIChordFormData } from '../../types';

export interface ExtendedFormData extends AIChordFormData {
    spotifyUrl?: string;
    youtubeUrl?: string;
    difficulty: string;
}

export const useAIChordGenerator = () => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [generatedResult, setGeneratedResult] = useState<any>(null);

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

            const responseText = result.text;
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const chordData = JSON.parse(cleanJson);

            if (!chordData || !chordData.chords) throw new Error("AI returned invalid structure.");

            if (isAdmin) {
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

    return {
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
    };
};
