import { supabase, normalizeSong } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { extractYouTubeId } from '@/lib/youtube';

export interface VideoTutorial {
  id: string;
  song_id?: string;
  video_id: string;
  title: string;
  thumbnail_url?: string;
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
  return extractYouTubeId(input);
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
 * Mengambil daftar video tutorial dari tabel 'page_content' (id: 'song_video_tutorials').
 * Opsi: Filter berdasarkan songId.
 */
export async function getVideoTutorials(songId?: string): Promise<VideoTutorial[]> {
  try {
    const { data: pageContent, error } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'song_video_tutorials')
      .maybeSingle();

    if (error) {
      console.error('[GET VIDEO TUTORIALS ERROR]:', error);
      return [];
    }

    const songTutorials = pageContent?.content?.song_tutorials || {};

    if (songId) {
      const list = songTutorials[songId] || [];
      return list.map((item: any) => ({
        id: item.id || item.video_id,
        song_id: songId,
        video_id: item.video_id,
        title: item.title || 'Tutorial Gitar',
        thumbnail_url: item.thumbnail_url || `https://img.youtube.com/vi/${item.video_id}/hqdefault.jpg`,
        is_active: item.is_active ?? true,
        created_at: item.created_at || new Date().toISOString()
      }));
    }

    // Accumulate all song tutorials
    const allTutorials: VideoTutorial[] = [];
    Object.keys(songTutorials).forEach(sId => {
      if (Array.isArray(songTutorials[sId])) {
        songTutorials[sId].forEach((item: any) => {
          allTutorials.push({
            id: item.id || item.video_id,
            song_id: sId,
            video_id: item.video_id,
            title: item.title || 'Tutorial Gitar',
            thumbnail_url: item.thumbnail_url || `https://img.youtube.com/vi/${item.video_id}/hqdefault.jpg`,
            is_active: item.is_active ?? true,
            created_at: item.created_at || new Date().toISOString()
          });
        });
      }
    });

    return allTutorials;
  } catch (err) {
    console.error('[GET VIDEO TUTORIALS ERROR]:', err);
    return [];
  }
}

/**
 * Menambahkan video tutorial gitar baru untuk lagu tertentu ke tabel 'page_content'.
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
    const { data: pageContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'song_video_tutorials')
      .maybeSingle();

    const content = pageContent?.content || { song_tutorials: {} };
    if (!content.song_tutorials) {
      content.song_tutorials = {};
    }

    const currentSongList = content.song_tutorials[songId] || [];

    const newTutorial: VideoTutorial = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tut_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      song_id: songId,
      video_id: cleanVideoId,
      title: title.trim(),
      thumbnail_url: `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
      is_active: true,
      created_at: new Date().toISOString()
    };

    content.song_tutorials[songId] = [newTutorial, ...currentSongList];

    const { error: upsertErr } = await supabase
      .from('page_content')
      .upsert({
        id: 'song_video_tutorials',
        content,
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      return { success: false, error: upsertErr.message };
    }

    return { success: true, data: newTutorial };
  } catch (err: any) {
    console.error('[ADD VIDEO TUTORIAL ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat menyimpan tutorial.' };
  }
}

/**
 * Menghapus video tutorial berdasarkan ID dari tabel 'page_content'
 */
export async function deleteVideoTutorial(
  songIdOrTutorialId: string,
  optionalTutorialId?: string
): Promise<CuratedResponse> {
  const songId = optionalTutorialId ? songIdOrTutorialId : undefined;
  const targetId = optionalTutorialId || songIdOrTutorialId;

  if (!targetId) {
    return { success: false, error: 'ID Tutorial tidak valid.' };
  }

  try {
    const { data: pageContent } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'song_video_tutorials')
      .maybeSingle();

    const content = pageContent?.content || { song_tutorials: {} };
    const songTutorials = content.song_tutorials || {};

    if (songId && songTutorials[songId]) {
      songTutorials[songId] = songTutorials[songId].filter(
        (item: any) => item.id !== targetId && item.video_id !== targetId
      );
    } else {
      Object.keys(songTutorials).forEach(sId => {
        if (Array.isArray(songTutorials[sId])) {
          songTutorials[sId] = songTutorials[sId].filter(
            (item: any) => item.id !== targetId && item.video_id !== targetId
          );
        }
      });
    }

    content.song_tutorials = songTutorials;

    const { error: upsertErr } = await supabase
      .from('page_content')
      .upsert({
        id: 'song_video_tutorials',
        content,
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      return { success: false, error: upsertErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[DELETE VIDEO TUTORIAL ERROR]:', err);
    return { success: false, error: err?.message || 'Gagal menghapus video tutorial.' };
  }
}
