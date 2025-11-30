import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Song, Album, PageContent } from '../../types';
import { seedDatabase } from '../seeder';
import { useNavigate } from 'react-router-dom';

export const useHomeData = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoadingSongs, setIsLoadingSongs] = useState(true);
    const [pageContent, setPageContent] = useState<PageContent['content'] | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const navigate = useNavigate();

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

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            const result = await seedDatabase();
            if (result.failed > 0 && result.success === 0) {
                alert("Seeding failed. You might need to Sign In first due to security policies.");
                navigate('/auth');
            } else {
                await fetchData();
            }
        } catch (e) {
            alert("Seeding error. See console.");
        } finally {
            setIsSeeding(false);
        }
    };

    return {
        songs,
        albums,
        isLoadingSongs,
        pageContent,
        fetchError,
        refetch: fetchData,
        handleSeed,
        isSeeding
    };
};
