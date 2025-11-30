import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Song } from '../../types';

export interface SongFormData {
    id: string;
    title: string;
    artist: string;
    difficulty: string;
    spotify_id: string;
    youtube_id: string;
    rawText: string;
}

const INITIAL_STATE: SongFormData = {
    id: '',
    title: '',
    artist: '',
    difficulty: 'Medium',
    spotify_id: '',
    youtube_id: '',
    rawText: ''
};

export const useSongForm = (initialSong?: Song) => {
    const [formData, setFormData] = useState<SongFormData>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialSong) {
            let raw = '';
            if (initialSong.chords) {
                if (Array.isArray(initialSong.chords) && initialSong.chords.length > 0) {
                    if (typeof initialSong.chords[0] === 'string') {
                        raw = (initialSong.chords as unknown as string[]).join('\n');
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        raw = (initialSong.chords as any[]).map((line: any) => {
                            if (line.chords && line.chords.length > 0) {
                                const chordStr = line.chords.map((c: string) => `[${c}]`).join('');
                                return `${chordStr}${line.line}`;
                            }
                            return line.line;
                        }).join('\n');
                    }
                }
            }

            setFormData({
                id: initialSong.id,
                title: initialSong.title,
                artist: initialSong.artist,
                difficulty: initialSong.difficulty,
                spotify_id: initialSong.spotify_track_id || '',
                youtube_id: initialSong.youtube_video_id || '',
                rawText: raw || ''
            });
        }
    }, [initialSong]);

    const updateField = (field: keyof SongFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveSong = async () => {
        setLoading(true);
        setError(null);

        const lines = formData.rawText.split('\n');
        const payload = {
            title: formData.title,
            artist: formData.artist,
            difficulty: formData.difficulty,
            spotify_track_id: formData.spotify_id,
            youtube_video_id: formData.youtube_id,
            chords: lines,
        };

        try {
            if (formData.id) {
                const { error: updateError } = await supabase.from('songs').update(payload).eq('id', formData.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('songs').insert([{ ...payload, view_count: 0 }]);
                if (insertError) throw insertError;
            }
            
            if (!formData.id) {
                setFormData(INITIAL_STATE);
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        updateField,
        loading,
        error,
        saveSong
    };
};
