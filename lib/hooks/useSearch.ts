import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { SearchResult } from '../../types';
import { mapSongToResult, mapAlbumToResult, mapVideoToResult } from '../utils';

export type SearchTab = 'all' | 'songs' | 'albums' | 'tutorials';

export const useSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<SearchTab>('all');

    useEffect(() => {
        const fetchSuggestions = async () => {
            const { data: trending } = await supabase.from('songs').select('id, title, artist').order('view_count', { ascending: false }).limit(3);
            const suggs: SearchResult[] = [];

            if (trending) {
                suggs.push(...trending.map(s => ({
                    id: `trend-${s.id}`,
                    title: s.title,
                    artist: s.artist,
                    source: 'library' as const,
                    url: `/song/${s.id}`,
                    thumbnail: 'trend'
                })));
            }
            setSuggestions(suggs);
        };
        fetchSuggestions();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length === 0) {
                setResults([]);
                return;
            }

            if (query.length < 2) return;
            setIsLoading(true);

            try {
                const newResults: SearchResult[] = [];

                // 1. Search Local Library (Songs) - Matches Title OR Artist
                if (activeTab === 'all' || activeTab === 'songs') {
                    const { data: librarySongs } = await supabase
                        .from('songs')
                        .select('id, title, artist')
                        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
                        .limit(5);

                    if (librarySongs) {
                        newResults.push(...librarySongs.map(mapSongToResult));
                    }
                }

                // 2. Search Local Library (Albums) - Matches Title OR Artist
                if (activeTab === 'all' || activeTab === 'albums') {
                    const { data: libraryAlbums } = await supabase
                        .from('albums')
                        .select('id, title, artist, cover_url')
                        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
                        .limit(4);

                    if (libraryAlbums) {
                        newResults.push(...libraryAlbums.map(mapAlbumToResult));
                    }
                }

                // 3. Search Local Video Tutorials
                if (activeTab === 'all' || activeTab === 'tutorials') {
                    const { data: localVideos } = await supabase
                        .from('video_tutorials')
                        .select('video_id, title, channel_title, thumbnail_url')
                        .ilike('title', `%${query}%`)
                        .eq('is_active', true)
                        .limit(3);

                    if (localVideos) {
                        newResults.push(...localVideos.map(mapVideoToResult));
                    }
                }

                // 4. External API Searches (Spotify & YouTube)
                const promises = [];
                if (activeTab === 'all' || activeTab === 'songs') {
                    promises.push(supabase.functions.invoke('search-spotify', { body: { query } }));
                }
                // Only fetch external YouTube if specifically looking for tutorials or all
                if (activeTab === 'all' || activeTab === 'tutorials') {
                    promises.push(supabase.functions.invoke('search-youtube', { body: { query } }));
                }

                const resultsExternal = await Promise.allSettled(promises);

                resultsExternal.forEach(res => {
                    if (res.status === 'fulfilled' && res.value.data) {
                        const data = res.value.data;

                        // Spotify Results
                        if (data.tracks?.items) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            newResults.push(...data.tracks.items.slice(0, 2).map((item: any) => ({
                                id: item.id,
                                title: item.name,
                                artist: item.artists[0].name,
                                thumbnail: item.album.images[2]?.url,
                                source: 'spotify',
                                url: item.external_urls?.spotify
                            })));
                        }

                        // YouTube External Results
                        if (data.items) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            newResults.push(...data.items.slice(0, 2).map((item: any) => ({
                                id: item.id.videoId,
                                title: item.snippet.title,
                                artist: item.snippet.channelTitle,
                                thumbnail: item.snippet.thumbnails.default?.url,
                                source: 'youtube',
                                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                            })));
                        }
                    }
                });
                setResults(newResults);
            } catch (err) {
                // Ignore errors
            } finally {
                setIsLoading(false);
            }
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [query, activeTab]);

    return {
        query,
        setQuery,
        results,
        setResults,
        suggestions,
        isLoading,
        activeTab,
        setActiveTab
    };
};
