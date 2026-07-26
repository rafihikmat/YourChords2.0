import { createClient } from '@supabase/supabase-js';
import { Song } from './types';
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
