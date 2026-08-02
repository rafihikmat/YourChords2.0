import { cache } from 'react';
import { supabase, normalizeSong } from './supabase';
import { Song } from './types';

export const getSongById = cache(async (songId: string): Promise<Song | null> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        albums (
          id,
          title,
          cover_url,
          release_year
        )
      `)
      .eq('id', songId)
      .single();

    if (!error && data) {
      return normalizeSong(data);
    }

    const { data: chordData, error: chordErr } = await supabase
      .from('chords')
      .select('*')
      .eq('id', songId)
      .single();

    if (!chordErr && chordData) {
      return normalizeSong(chordData);
    }

    return null;
  } catch (err) {
    console.error('[GET SONG BY ID ERROR]:', err);
    return null;
  }
});

export const fetchSongById = getSongById;

export const getRelatedSongs = cache(async (songId: string, limit = 6): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .neq('id', songId)
      .limit(limit);

    if (error || !data) return [];
    return data.map(normalizeSong);
  } catch (err) {
    return [];
  }
});

export const getTopSongs = cache(async (limit = 8): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(normalizeSong);
  } catch (err) {
    return [];
  }
});

export const getTrendingSongs = getTopSongs;

export const getNewReleases = cache(async (limit = 8): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(normalizeSong);
  } catch (err) {
    return [];
  }
});

export const getLatestSongs = getNewReleases;

export const getPopularArtists = cache(async (limit = 8): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('artist')
      .limit(20);

    if (error || !data) return [];
    const uniqueArtists = Array.from(new Set(data.map((item: any) => item.artist))).filter(Boolean);
    return uniqueArtists.slice(0, limit);
  } catch (err) {
    return [];
  }
});

export const getFeaturedHeroSongs = cache(async (limit = 5): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(normalizeSong);
  } catch (err) {
    return [];
  }
});

export { searchSongs } from './supabase';
