import { createClient } from '@supabase/supabase-js';
import { Song, Setlist } from './types';
import { INITIAL_FALLBACK_CHORDS, getFallbackChordById, getFallbackChords } from './fallbackData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function normalizeSong(row: any): Song {
  if (!row) return row;
  const rawContent = row.content || (typeof row.chords === 'string' ? row.chords : row.chords ? JSON.stringify(row.chords) : '');
  const views = row.view_count ?? row.views ?? 0;

  let albumCover: string | undefined = undefined;
  if (row.albums) {
    if (Array.isArray(row.albums)) {
      albumCover = row.albums[0]?.cover_url;
    } else if (typeof row.albums === 'object') {
      albumCover = row.albums.cover_url;
    }
  }

  const coverUrl = albumCover || row.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";

  return {
    ...row,
    id: row.id || String(row.title || 'song').toLowerCase().replace(/\s+/g, '-'),
    title: row.title || 'Untitled',
    artist: row.artist || 'Unknown Artist',
    content: rawContent || row.content || '',
    chords: row.chords || rawContent,
    views: views,
    view_count: views,
    cover_url: coverUrl,
    source_url: row.source_url || ""
  };
}

export async function getAllSongs(limit = 30): Promise<Song[]> {
  return fetchAllSongs(limit);
}

export async function getTrendingSongs(limit = 15): Promise<Song[]> {
  try {
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    const { data: chordsData, error: chordsErr } = await supabase
      .from('chords')
      .select('*')
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!chordsErr && chordsData && chordsData.length > 0) {
      return chordsData.map(normalizeSong);
    }
  } catch (e) {
    console.error('[SUPABASE GET TRENDING SONGS ERROR]:', e);
  }

  return [];
}

export async function getFeaturedHeroSongs(): Promise<Song[]> {
  try {
    const { data: pageContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'hero_carousel')
      .maybeSingle();

    const songIds: string[] = pageContent?.content?.song_ids || [];

    if (songIds.length > 0) {
      const { data: songsData, error: songsErr } = await supabase
        .from('songs')
        .select('*, albums(cover_url)')
        .in('id', songIds);

      if (!songsErr && songsData && songsData.length > 0) {
        const normalized = songsData.map(normalizeSong);
        const sorted = songIds
          .map(id => normalized.find(s => s.id === id))
          .filter((s): s is Song => Boolean(s));

        if (sorted.length > 0) {
          return sorted;
        }
      }
    }

    const { data: fallbackData } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData.map(normalizeSong);
    }
  } catch (err) {
    console.error('[GET FEATURED HERO SONGS ERROR]:', err);
  }

  return [];
}

export async function fetchAllSongs(limit = 30): Promise<Song[]> {
  try {
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    const { data: chordsData, error: chordsErr } = await supabase
      .from('chords')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!chordsErr && chordsData && chordsData.length > 0) {
      return chordsData.map(normalizeSong);
    }
  } catch (e) {
    console.error('[SUPABASE FETCH SONGS ERROR]:', e);
  }

  return [];
}

export async function fetchSongById(id: string): Promise<Song | null> {
  try {
    const { data: songData, error: songErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .eq('id', id)
      .single();

    if (!songErr && songData) {
      return normalizeSong(songData);
    }

    const { data: chordData, error: chordErr } = await supabase
      .from('chords')
      .select('*')
      .eq('id', id)
      .single();

    if (!chordErr && chordData) {
      return normalizeSong(chordData);
    }
  } catch (e) {
    console.error('[SUPABASE FETCH SONG BY ID ERROR]:', e);
  }

  return null;
}

export const getSongById = fetchSongById;

export async function getRelatedSongs(artist: string, currentSongId: string, limit = 5): Promise<Song[]> {
  try {
    if (artist) {
      const { data, error } = await supabase
        .from('songs')
        .select('*, albums(cover_url)')
        .ilike('artist', `%${artist}%`)
        .neq('id', currentSongId)
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map(normalizeSong);
      }
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .neq('id', currentSongId)
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map(normalizeSong);
    }
  } catch (err) {
    console.warn('[GET RELATED SONGS WARN]:', err);
  }
  return [];
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  try {
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .or(`title.ilike.%${q}%,artist.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    const { data: chordsData, error: chordsErr } = await supabase
      .from('chords')
      .select('*')
      .or(`title.ilike.%${q}%,artist.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (!chordsErr && chordsData && chordsData.length > 0) {
      return chordsData.map(normalizeSong);
    }
  } catch (e) {
    console.error('[SUPABASE SEARCH SONGS ERROR]:', e);
  }

  return [];
}

export function formatViewCount(views?: number | null): string {
  if (!views || views <= 0) return '0 VIEWS';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M VIEWS`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K VIEWS`;
  return `${views} VIEWS`;
}

export async function getLatestSongs(limit = 15): Promise<Song[]> {
  try {
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    const { data: chordsData, error: chordsErr } = await supabase
      .from('chords')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!chordsErr && chordsData && chordsData.length > 0) {
      return chordsData.map(normalizeSong);
    }
  } catch (e) {
    console.error('[SUPABASE GET LATEST SONGS ERROR]:', e);
  }

  return [];
}

export async function incrementSongViews(songId: string): Promise<number> {
  if (!songId) return 0;
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('increment_song_views', { song_id: songId });
    if (!rpcErr && typeof rpcData === 'number') {
      return rpcData;
    }

    const { data: songData } = await supabase
      .from('songs')
      .select('view_count')
      .eq('id', songId)
      .maybeSingle();

    if (songData) {
      const current = Number(songData.view_count) || 0;
      const nextViews = current + 1;
      await supabase
        .from('songs')
        .update({ view_count: nextViews })
        .eq('id', songId);
      return nextViews;
    }

    const { data: chordData } = await supabase
      .from('chords')
      .select('views')
      .eq('id', songId)
      .maybeSingle();

    if (chordData) {
      const current = Number(chordData.views) || 0;
      const nextViews = current + 1;
      await supabase
        .from('chords')
        .update({ views: nextViews })
        .eq('id', songId);
      return nextViews;
    }
  } catch (err) {
    console.warn('[INCREMENT SONG VIEWS WARN]:', err);
  }
  return 0;
}

export async function incrementSongView(id: string, currentViews = 0) {
  return incrementSongViews(id);
}

/**
 * Mencatat pencarian kata kunci yang tidak ditemukan ke database Supabase
 * (menggunakan 'missing_songs_log' atau 'search_logs' dengan logika UPSERT)
 */
export async function logMissingSearch(rawQuery: string): Promise<void> {
  if (!rawQuery || !rawQuery.trim()) return;
  const cleanQuery = rawQuery.trim().toLowerCase();

  try {
    // 1. Coba di tabel 'missing_songs_log'
    const { data: existing, error: findErr } = await supabase
      .from('missing_songs_log')
      .select('*')
      .eq('query', cleanQuery)
      .maybeSingle();

    if (!findErr && existing) {
      await supabase
        .from('missing_songs_log')
        .update({
          count: (existing.count || 1) + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq('query', cleanQuery);
      return;
    }

    if (!findErr && !existing) {
      const { error: insertErr } = await supabase
        .from('missing_songs_log')
        .insert({
          query: cleanQuery,
          count: 1,
          last_searched_at: new Date().toISOString()
        });

      if (!insertErr) return;
    }

    // 2. Fallback ke tabel 'search_logs' jika 'missing_songs_log' belum dibuat
    const { data: existingLog } = await supabase
      .from('search_logs')
      .select('*')
      .eq('query', cleanQuery)
      .maybeSingle();

    if (existingLog) {
      await supabase
        .from('search_logs')
        .update({
          count: (existingLog.count || 1) + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq('query', cleanQuery);
    } else {
      await supabase
        .from('search_logs')
        .insert({
          query: cleanQuery,
          count: 1,
          last_searched_at: new Date().toISOString()
        });
    }
  } catch (err) {
    console.error('[LOG MISSING SEARCH ERROR]:', err);
  }
}

/**
 * Toggles favorite state in Supabase `song_favorites` or localStorage fallback.
 */
export async function toggleSongFavorite(userId: string, songId: string): Promise<boolean> {
  if (!songId) return false;
  
  const localFavKey = 'yourchords_favorites';
  
  const getLocalFavs = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(localFavKey) || '[]');
    } catch { return []; }
  };

  const setLocalFavs = (favs: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localFavKey, JSON.stringify(favs));
    }
  };

  // If user is guest/anonymous, use localStorage
  if (!userId || userId === 'guest' || userId === 'demo-user') {
    const favs = getLocalFavs();
    const isFav = favs.includes(songId);
    let newFavs: string[];
    if (isFav) {
      newFavs = favs.filter(id => id !== songId);
    } else {
      newFavs = [...favs, songId];
    }
    setLocalFavs(newFavs);
    return !isFav;
  }

  try {
    const { data: existing } = await supabase
      .from('song_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('song_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('song_id', songId);
      return false;
    } else {
      await supabase
        .from('song_favorites')
        .insert({ user_id: userId, song_id: songId });
      return true;
    }
  } catch (e) {
    console.warn('[SUPABASE FAVORITE TOGGLE WARN]:', e);
    const favs = getLocalFavs();
    const isFav = favs.includes(songId);
    if (isFav) {
      setLocalFavs(favs.filter(id => id !== songId));
      return false;
    } else {
      setLocalFavs([...favs, songId]);
      return true;
    }
  }
}

/**
 * Checks if song is in user's favorites.
 */
export async function checkIsFavorite(userId: string, songId: string): Promise<boolean> {
  if (!songId) return false;

  const localFavKey = 'yourchords_favorites';
  const getLocalFavs = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(localFavKey) || '[]');
    } catch { return []; }
  };

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return getLocalFavs().includes(songId);
  }

  try {
    const { data } = await supabase
      .from('song_favorites')
      .select('song_id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (data) return true;
    return getLocalFavs().includes(songId);
  } catch {
    return getLocalFavs().includes(songId);
  }
}

/* ====================================================================
   PERSONAL NOTES & STRUMMING PATTERN ENGINE
==================================================================== */

const LOCAL_NOTES_KEY = 'yourchords_user_notes';

/**
 * Get user's personal note/strumming pattern for a song
 */
export async function getUserSongNote(userId: string, songId: string): Promise<string> {
  if (!songId) return '';

  const getLocalNote = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const notesMap = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '{}');
      return notesMap[songId] || '';
    } catch { return ''; }
  };

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return getLocalNote();
  }

  try {
    const { data } = await supabase
      .from('user_song_notes')
      .select('note')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (data && data.note) return data.note;
    return getLocalNote();
  } catch {
    return getLocalNote();
  }
}

/**
 * Save user's personal note/strumming pattern for a song
 */
export async function saveUserSongNote(userId: string, songId: string, noteText: string): Promise<boolean> {
  if (!songId) return false;

  const setLocalNote = (text: string) => {
    if (typeof window === 'undefined') return;
    try {
      const notesMap = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '{}');
      if (text.trim()) {
        notesMap[songId] = text;
      } else {
        delete notesMap[songId];
      }
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notesMap));
    } catch (e) {
      console.warn('[LOCAL STORAGE NOTE SAVE ERROR]:', e);
    }
  };

  setLocalNote(noteText);

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return true;
  }

  try {
    const { data: existing } = await supabase
      .from('user_song_notes')
      .select('id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_song_notes')
        .update({ note: noteText, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_song_notes')
        .insert({ user_id: userId, song_id: songId, note: noteText });
    }
    return true;
  } catch (e) {
    console.warn('[SUPABASE NOTE SAVE WARN]:', e);
    return true;
  }
}

/* ====================================================================
   SETLIST & SONGBOOK MANAGEMENT SYSTEM
==================================================================== */

export { 
  getUserSetlists, 
  createSetlist, 
  addSongToSetlist, 
  removeSongFromSetlist, 
  deleteSetlist,
  getUserFavorites
} from '@/lib/setlists';


