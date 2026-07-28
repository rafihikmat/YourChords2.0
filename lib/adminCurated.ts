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
 * Mengambil daftar lagu yang di-pin ke Hero Carousel dari tabel 'page_content' (id: 'hero_carousel').
 */
export async function getFeaturedHeroSongs(): Promise<Song[]> {
  try {
    // 1. Fetch record from 'page_content' where id = 'hero_carousel'
    const { data: pageContent, error: pcErr } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'hero_carousel')
      .maybeSingle();

    const songIds: string[] = pageContent?.content?.song_ids || [];

    if (songIds.length > 0) {
      // Fetch songs from 'songs' with album JOIN
      const { data: songsData, error: songsErr } = await supabase
        .from('songs')
        .select('*, albums(cover_url)')
        .in('id', songIds);

      if (!songsErr && songsData && songsData.length > 0) {
        const normalized = songsData.map(normalizeSong);
        // Order according to position in songIds array
        const sorted = songIds
          .map(id => normalized.find(s => s.id === id))
          .filter((s): s is Song => Boolean(s));

        if (sorted.length > 0) {
          return sorted;
        }
      }
    }

    // Fallback: If page_content is empty or no songs found, fetch top 5 songs by view_count
    const { data: fallbackData } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(5);

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData.map(normalizeSong);
    }
  } catch (err) {
    console.error('[GET FEATURED HERO SONGS ERROR]:', err);
  }

  return [];
}

/**
 * Mengubah status featured/pin lagu untuk Hero Carousel Beranda via tabel 'page_content'.
 */
export async function toggleSongFeaturedStatus(
  songId: string, 
  isFeatured: boolean
): Promise<CuratedResponse<Song>> {
  if (!songId) {
    return { success: false, error: 'ID Lagu tidak valid.' };
  }

  try {
    // 1. Fetch existing 'hero_carousel' record from 'page_content'
    const { data: pageContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'hero_carousel')
      .maybeSingle();

    let currentIds: string[] = pageContent?.content?.song_ids || [];

    if (isFeatured) {
      if (!currentIds.includes(songId)) {
        currentIds.push(songId);
      }
    } else {
      currentIds = currentIds.filter(id => id !== songId);
    }

    // 2. Upsert to 'page_content'
    const { error: upsertErr } = await supabase
      .from('page_content')
      .upsert({
        id: 'hero_carousel',
        content: { song_ids: currentIds },
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      return { success: false, error: upsertErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[TOGGLE FEATURED STATUS ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem.' };
  }
}

/**
 * Memperbarui urutan lagu Hero Carousel pada tabel 'page_content'.
 */
export async function reorderHeroSongs(songIds: string[]): Promise<CuratedResponse> {
  try {
    const { error } = await supabase
      .from('page_content')
      .upsert({
        id: 'hero_carousel',
        content: { song_ids: songIds },
        updated_at: new Date().toISOString()
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui urutan Hero Carousel.' };
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
