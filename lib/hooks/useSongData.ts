import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Song } from '../../types';

export const useSongData = (id: string | undefined) => {
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
            setError("Invalid Song ID");
            setLoading(false);
            return;
        }

        const fetchSong = async () => {
            try {
                const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
                if (error || !data) throw new Error("Song not found");
                setSong(data as unknown as Song);
                // Fire & Forget View Count
                supabase.rpc('increment_view_count', { row_id: id });
            } catch (err) {
                setError("Could not retrieve song data.");
            } finally {
                setLoading(false);
            }
        };
        fetchSong();
    }, [id]);

    return { song, loading, error };
};
