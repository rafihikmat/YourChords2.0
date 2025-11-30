import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Song, Album } from '../../types';

export const useHomeData = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoadingSongs, setIsLoadingSongs] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pageContent, setPageContent] = useState<any>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoadingSongs(true);
        setFetchError(null);
        try {
            // 1. Content
            const { data: cmsData } = await supabase.from('page_content').select('content').eq('id', 'home').single();
            if (cmsData) setPageContent(cmsData.content);

            // 2. Songs
            const { data, error } = await supabase.from('songs').select('*').order('view_count', { ascending: false }).limit(12);
            
            if (error) {
                console.error("Supabase Song Error:", error);
                setFetchError(error.message);
                setSongs([]);
            } else if (data) {
                const safeData = data as unknown as Song[];
                setSongs(safeData);
            }

            // 3. Albums
            const { data: albumData } = await supabase.from('albums').select('*').limit(4);
            if (albumData) setAlbums(albumData as unknown as Album[]);

        } catch (err: unknown) {
            console.error("Data load failed", err);
            if (err instanceof Error) {
                setFetchError(err.message);
            } else {
                setFetchError("Unknown error");
            }
            setSongs([]);
        } finally {
            setIsLoadingSongs(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        songs,
        albums,
        isLoadingSongs,
        pageContent,
        fetchError,
        refetch: fetchData
    };
};
