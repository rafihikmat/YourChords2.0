import { supabase, normalizeSong } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { extractYouTubeId } from '@/lib/youtube';

export interface CMSResponse<T = Song> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper konversi aman untuk memastikan chords/content selalu bertipe string murni
 */
export function parseContentToString(rawContent: any): string {
  if (!rawContent) return "";
  if (typeof rawContent === "string") return rawContent;
  if (typeof rawContent === "object") {
    // Jika berbentuk object JSON (misal { text: "..." } atau { chords: "..." } atau { content: "..." })
    if (rawContent.text && typeof rawContent.text === "string") return rawContent.text;
    if (rawContent.chords && typeof rawContent.chords === "string") return rawContent.chords;
    if (rawContent.content && typeof rawContent.content === "string") return rawContent.content;
    try {
      return JSON.stringify(rawContent, null, 2);
    } catch {
      return String(rawContent);
    }
  }
  return String(rawContent);
}

/**
 * Mengambil data lagu spesifik dari tabel 'songs' Supabase berdasarkan UUID
 */
export async function getSongForEdit(id: string): Promise<CMSResponse<Song>> {
  if (!id) {
    return { success: false, error: 'ID Lagu tidak valid.' };
  }

  try {
    // 1. Coba ambil dari tabel 'songs' dengan JOIN ke 'albums'
    const { data: songData, error: songErr } = await supabase
      .from('songs')
      .select('*, albums(cover_url)')
      .eq('id', id)
      .maybeSingle();

    if (!songErr && songData) {
      return { success: true, data: normalizeSong(songData) };
    }

    // 2. Fallback ke tabel 'chords'
    const { data: chordData, error: chordErr } = await supabase
      .from('chords')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!chordErr && chordData) {
      return { success: true, data: normalizeSong(chordData) };
    }

    // 3. Fallback data statis jika ID cocok dengan fallback
    const { INITIAL_FALLBACK_CHORDS } = await import('@/lib/fallbackData');
    const fallbackItem = INITIAL_FALLBACK_CHORDS.find(c => c.id === id);
    if (fallbackItem) {
      return { success: true, data: normalizeSong(fallbackItem) };
    }

    return { success: false, error: 'Lagu tidak ditemukan di database.' };
  } catch (err: any) {
    console.error('[GET SONG FOR EDIT ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan saat mengambil data lagu.' };
  }
}

/**
 * Meng-update rincian data lagu (title, artist, chords, cover_url, difficulty, youtube_video_id, spotify_track_id)
 */
export async function updateSongDetails(
  id: string,
  payload: Partial<Song>
): Promise<CMSResponse<Song>> {
  if (!id) {
    return { success: false, error: 'ID Lagu tidak valid.' };
  }

  const chordsContent = parseContentToString(payload.chords || payload.content || '');
  const cleanTitle = payload.title?.trim();
  const cleanArtist = payload.artist?.trim();
  const cleanCoverUrl = payload.cover_url?.trim();
  const cleanYouTubeId = extractYouTubeId(payload.youtube_video_id) || null;

  // Payload khusus untuk tabel 'songs' (HANYA berisi kolom valid: title, artist, chords, difficulty, youtube_video_id, spotify_track_id, album_id)
  const songUpdateBody: Record<string, any> = {
    title: cleanTitle,
    artist: cleanArtist,
    chords: chordsContent,
    difficulty: payload.difficulty || null,
    youtube_video_id: cleanYouTubeId,
    spotify_track_id: payload.spotify_track_id || null,
  };

  try {
    // Handling album & cover_url di tabel 'albums'
    if (cleanCoverUrl) {
      // Cek apakah lagu ini sudah memiliki album_id di tabel 'songs'
      const { data: existingSong } = await supabase
        .from('songs')
        .select('album_id')
        .eq('id', id)
        .maybeSingle();

      if (existingSong?.album_id) {
        // Update cover_url pada baris album yang ada
        await supabase
          .from('albums')
          .update({
            cover_url: cleanCoverUrl,
            title: cleanTitle || 'Album',
            artist: cleanArtist || 'Artist',
          })
          .eq('id', existingSong.album_id);
      } else {
        // Buat album baru di tabel 'albums'
        const { data: newAlbum } = await supabase
          .from('albums')
          .insert({
            title: cleanTitle || 'Single Album',
            artist: cleanArtist || 'Unknown Artist',
            cover_url: cleanCoverUrl,
          })
          .select('id')
          .maybeSingle();

        if (newAlbum?.id) {
          songUpdateBody.album_id = newAlbum.id;
        }
      }
    }

    // 1. Attempt update in 'songs' table dengan JOIN ke 'albums'
    const { data: updatedSong, error: songsErr } = await supabase
      .from('songs')
      .update(songUpdateBody)
      .eq('id', id)
      .select('*, albums(cover_url)')
      .maybeSingle();

    if (!songsErr && updatedSong) {
      return { success: true, data: normalizeSong(updatedSong) };
    }

    // 2. Fallback: Attempt update in 'chords' table
    const chordUpdateBody: Record<string, any> = {
      title: cleanTitle,
      artist: cleanArtist,
      content: chordsContent,
      cover_url: cleanCoverUrl || null,
      difficulty: payload.difficulty || null,
      youtube_video_id: cleanYouTubeId,
      spotify_track_id: payload.spotify_track_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedChord, error: chordsErr } = await supabase
      .from('chords')
      .update(chordUpdateBody)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!chordsErr && updatedChord) {
      return { success: true, data: normalizeSong(updatedChord) };
    }

    // 3. Jika tidak ada di kedua tabel, lakukan upsert ke tabel 'songs' dengan songUpdateBody
    const { data: insertedSong, error: insertErr } = await supabase
      .from('songs')
      .upsert({
        id,
        ...songUpdateBody,
        view_count: payload.view_count || payload.views || 0,
      })
      .select('*, albums(cover_url)')
      .maybeSingle();

    if (!insertErr && insertedSong) {
      return { success: true, data: normalizeSong(insertedSong) };
    }

    return { 
      success: false, 
      error: songsErr?.message || chordsErr?.message || insertErr?.message || 'Gagal menyimpan perubahan ke database.' 
    };
  } catch (err: any) {
    console.error('[UPDATE SONG DETAILS ERROR]:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan saat mengupdate lagu.' };
  }
}
