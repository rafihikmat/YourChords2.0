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
  return {
    ...row,
    id: row.id || String(row.title || 'song').toLowerCase().replace(/\s+/g, '-'),
    title: row.title || 'Untitled',
    artist: row.artist || 'Unknown Artist',
    content: rawContent || row.content || '',
    chords: row.chords || rawContent,
    views: views,
    view_count: views,
    cover_url: row.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop",
    source_url: row.source_url || ""
  };
}

export async function fetchAllSongs(limit = 20): Promise<Song[]> {
  try {
    // 1. Query 'songs' table (PRIMARY)
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    // 2. Query 'chords' table as backup if 'songs' table doesn't have rows
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
    console.error('[SUPABASE FETCH SONGS ERROR]:', e);
  }

  // System Guard Fallback
  return INITIAL_FALLBACK_CHORDS.slice(0, limit);
}

export async function fetchSongById(id: string): Promise<Song | null> {
  try {
    // 1. Query 'songs'
    const { data: songData, error: songErr } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (!songErr && songData) {
      return normalizeSong(songData);
    }

    // 2. Query 'chords'
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

  return getFallbackChordById(id);
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  try {
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*')
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

  return getFallbackChords(q);
}

export async function incrementSongView(id: string, currentViews = 0) {
  try {
    const nextViews = currentViews + 1;
    const { error: err1 } = await supabase
      .from('songs')
      .update({ view_count: nextViews })
      .eq('id', id);

    if (err1) {
      await supabase
        .from('chords')
        .update({ views: nextViews })
        .eq('id', id);
    }
  } catch {
    // Ignore error
  }
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

const LOCAL_SETLISTS_KEY = 'yourchords_user_setlists';

const getLocalSetlists = (): Setlist[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SETLISTS_KEY);
    if (!raw) {
      // Default demo setlist for immediate fun
      const defaultSetlist: Setlist[] = [
        {
          id: 'setlist-demo-1',
          user_id: 'guest',
          name: 'Nongkrong Akustik 🎸',
          description: 'Kumpulan chord lagu santai untuk nongkrong cafe',
          created_at: new Date().toISOString(),
          song_ids: ['surat-cinta-untuk-starla', 'akad'],
        },
      ];
      localStorage.setItem(LOCAL_SETLISTS_KEY, JSON.stringify(defaultSetlist));
      return defaultSetlist;
    }
    return JSON.parse(raw);
  } catch { return []; }
};

const setLocalSetlists = (setlists: Setlist[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_SETLISTS_KEY, JSON.stringify(setlists));
  }
};

/**
 * Fetch all setlists for a user
 */
export async function getUserSetlists(userId: string): Promise<Setlist[]> {
  const localSetlists = getLocalSetlists();

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return localSetlists;
  }

  try {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        created_at: item.created_at,
        song_ids: item.song_ids || [],
      }));
    }
  } catch (e) {
    console.warn('[SUPABASE SETLISTS FETCH WARN]:', e);
  }

  return localSetlists;
}

/**
 * Create a new setlist
 */
export async function createSetlist(userId: string, name: string, description = ''): Promise<Setlist | null> {
  const newSetlist: Setlist = {
    id: `setlist-${Date.now()}`,
    user_id: userId || 'guest',
    name: name.trim(),
    description: description.trim(),
    created_at: new Date().toISOString(),
    song_ids: [],
  };

  const currentLocal = getLocalSetlists();
  setLocalSetlists([newSetlist, ...currentLocal]);

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return newSetlist;
  }

  try {
    const { data, error } = await supabase
      .from('setlists')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim(),
        song_ids: [],
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        song_ids: data.song_ids || [],
      };
    }
  } catch (e) {
    console.warn('[SUPABASE CREATE SETLIST WARN]:', e);
  }

  return newSetlist;
}

/**
 * Add a song to a setlist
 */
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  if (!setlistId || !songId) return false;

  const setlists = getLocalSetlists();
  const targetIndex = setlists.findIndex(s => s.id === setlistId);

  if (targetIndex !== -1) {
    if (!setlists[targetIndex].song_ids.includes(songId)) {
      setlists[targetIndex].song_ids.push(songId);
      setLocalSetlists(setlists);
    }
  }

  try {
    const { data } = await supabase
      .from('setlists')
      .select('song_ids')
      .eq('id', setlistId)
      .maybeSingle();

    if (data) {
      const existingIds: string[] = data.song_ids || [];
      if (!existingIds.includes(songId)) {
        const updatedIds = [...existingIds, songId];
        await supabase
          .from('setlists')
          .update({ song_ids: updatedIds })
          .eq('id', setlistId);
      }
    }
  } catch (e) {
    console.warn('[SUPABASE ADD TO SETLIST WARN]:', e);
  }

  return true;
}

/**
 * Remove a song from a setlist
 */
export async function removeSongFromSetlist(setlistId: string, songId: string): Promise<boolean> {
  if (!setlistId || !songId) return false;

  const setlists = getLocalSetlists();
  const targetIndex = setlists.findIndex(s => s.id === setlistId);

  if (targetIndex !== -1) {
    setlists[targetIndex].song_ids = setlists[targetIndex].song_ids.filter(id => id !== songId);
    setLocalSetlists(setlists);
  }

  try {
    const { data } = await supabase
      .from('setlists')
      .select('song_ids')
      .eq('id', setlistId)
      .maybeSingle();

    if (data) {
      const existingIds: string[] = data.song_ids || [];
      const updatedIds = existingIds.filter(id => id !== songId);
      await supabase
        .from('setlists')
        .update({ song_ids: updatedIds })
        .eq('id', setlistId);
    }
  } catch (e) {
    console.warn('[SUPABASE REMOVE FROM SETLIST WARN]:', e);
  }

  return true;
}

/**
 * Delete a setlist completely
 */
export async function deleteSetlist(setlistId: string): Promise<boolean> {
  if (!setlistId) return false;

  const setlists = getLocalSetlists().filter(s => s.id !== setlistId);
  setLocalSetlists(setlists);

  try {
    await supabase
      .from('setlists')
      .delete()
      .eq('id', setlistId);
  } catch (e) {
    console.warn('[SUPABASE DELETE SETLIST WARN]:', e);
  }

  return true;
}

