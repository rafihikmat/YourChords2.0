import { supabase, normalizeSong } from '@/lib/supabase';
import { Song } from '@/lib/types';

export interface VideoTutorial {
  id: string;
  song_id: string;
  video_id: string;
  title: string;
  is_active?: boolean;
  created_at?: string;
  song_title?: string;
  song_artist?: string;
}

export interface CuratedResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extracts standard 11-character YouTube Video ID from various URL formats or raw ID.
 */
export function extractYoutubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // If it's already an 11-char ID without slashes or query strings
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for standard YouTube URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return trimmed;
}

/**
 * Mengambil daftar lagu yang ditandai 'is_featured' = true untuk Hero Carousel Beranda.
 */
export async function getFeaturedHeroSongs(): Promise<Song[]> {
  try {
    // 1. Query 'songs' table
    const { data: songsData, error: songsErr } = await supabase
      .from('songs')
      .select('*')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!songsErr && songsData && songsData.length > 0) {
      return songsData.map(normalizeSong);
    }

    // 2. Fallback to 'chords' table if 'songs' table has no featured items
    const { data: chordsData, error: chordsErr } = await supabase
      .from('chords')
      .select('*')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!chordsErr && chordsData && chordsData.length > 0) {
      return chordsData.map(normalizeSong);
    }
  } catch (err) {
    console.error('[GET FEATURED HERO SONGS ERROR]:', err);
  }

  return [];
}

/**
 * Mengubah status featured/pin lagu untuk Hero Carousel Beranda.
 */
export async function toggleSongFeaturedStatus(
  songId: string, 
  isFeatured: boolean, 
  order: number = 1
): Promise<CuratedResponse<Song>> {
  if (!songId) {
    return { success: false, error: 'ID Lagu tidak valid.' };
  }

  const updateBody = {
    is_featured: isFeatured,
    featured_order: order,
    updated_at: new Date().toISOString()
  };

  try {
    // 1. Try updating in 'songs' table
    const { data: updatedSong, error: songErr } = await supabase
      .from('songs')
      .update(updateBody)
      .eq('id', songId)
      .select('*')
      .maybeSingle();

    if (!songErr && updatedSong) {
      return { success: true, data: normalizeSong(updatedSong) };
    }

    // 2. Try updating in 'chords' table
    const { data: updatedChord, error: chordErr } = await supabase
      .from('chords')
      .update(updateBody)
      .eq('id', songId)
      .select('*')
      .maybeSingle();

    if (!chordErr && updatedChord) {
      return { success: true, data: normalizeSong(updatedChord) };
    }

    return { 
      success: false, 
      error: songErr?.message || chordErr?.message || 'Gagal mengubah status Hero Carousel lagu.' 
    };
  } catch (err: any) {
    console.error('[TOGGLE FEATURED STATUS ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem.' };
  }
}

/**
 * Mengambil daftar video tutorial dari tabel 'video_tutorials'.
 * Opsi: Filter berdasarkan songId.
 */
export async function getVideoTutorials(songId?: string): Promise<VideoTutorial[]> {
  try {
    let query = supabase.from('video_tutorials').select('*');

    if (songId) {
      query = query.eq('song_id', songId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((item: any) => ({
        id: item.id || item.video_id,
        song_id: item.song_id,
        video_id: item.video_id,
        title: item.title || 'Tutorial Gitar',
        is_active: item.is_active ?? true,
        created_at: item.created_at || new Date().toISOString()
      }));
    }
  } catch (err) {
    console.error('[GET VIDEO TUTORIALS ERROR]:', err);
  }

  return [];
}

/**
 * Menambahkan video tutorial gitar baru untuk lagu tertentu.
 */
export async function addVideoTutorial(
  songId: string, 
  youtubeUrlOrId: string, 
  title: string
): Promise<CuratedResponse<VideoTutorial>> {
  if (!songId) {
    return { success: false, error: 'Pilih lagu terlebih dahulu.' };
  }

  const cleanVideoId = extractYoutubeId(youtubeUrlOrId);
  if (!cleanVideoId) {
    return { success: false, error: 'URL atau Video ID YouTube tidak valid.' };
  }

  if (!title || !title.trim()) {
    return { success: false, error: 'Judul video tutorial wajib diisi.' };
  }

  try {
    const newRecord = {
      song_id: songId,
      video_id: cleanVideoId,
      title: title.trim(),
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('video_tutorials')
      .insert([newRecord])
      .select('*')
      .maybeSingle();

    if (!error) {
      return { 
        success: true, 
        data: {
          id: data?.id || cleanVideoId,
          song_id: songId,
          video_id: cleanVideoId,
          title: title.trim(),
          is_active: true,
          created_at: data?.created_at || new Date().toISOString()
        } 
      };
    }

    return { success: false, error: error.message || 'Gagal menyimpan video tutorial ke database.' };
  } catch (err: any) {
    console.error('[ADD VIDEO TUTORIAL ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat menyimpan tutorial.' };
  }
}

/**
 * Menghapus video tutorial berdasarkan ID
 */
export async function deleteVideoTutorial(tutorialId: string): Promise<CuratedResponse> {
  if (!tutorialId) {
    return { success: false, error: 'ID Tutorial tidak valid.' };
  }

  try {
    const { error } = await supabase
      .from('video_tutorials')
      .delete()
      .eq('id', tutorialId);

    if (error) {
      // Fallback try matching by video_id
      const { error: err2 } = await supabase
        .from('video_tutorials')
        .delete()
        .eq('video_id', tutorialId);

      if (err2) {
        return { success: false, error: err2.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[DELETE VIDEO TUTORIAL ERROR]:', err);
    return { success: false, error: err?.message || 'Gagal menghapus video tutorial.' };
  }
}
