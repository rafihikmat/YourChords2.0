import { supabase, normalizeSong } from '@/lib/supabase';
import { Song } from '@/lib/types';

export interface CMSResponse<T = Song> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Mengambil data lagu spesifik dari tabel 'songs' Supabase berdasarkan UUID
 */
export async function getSongForEdit(id: string): Promise<CMSResponse<Song>> {
  if (!id) {
    return { success: false, error: 'ID Lagu tidak valid.' };
  }

  try {
    // 1. Coba ambil dari tabel 'songs'
    const { data: songData, error: songErr } = await supabase
      .from('songs')
      .select('*')
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

  const chordsContent = payload.chords || payload.content || '';

  // Payload khusus untuk tabel 'songs' (HANYA menggunakan kolom 'chords', HAPUS 'content')
  const songUpdateBody: Record<string, any> = {
    title: payload.title?.trim(),
    artist: payload.artist?.trim(),
    chords: chordsContent,
    cover_url: payload.cover_url || null,
    difficulty: payload.difficulty || null,
    youtube_video_id: payload.youtube_video_id || null,
    spotify_track_id: payload.spotify_track_id || null,
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Attempt update in 'songs' table (tanpa properti 'content')
    const { data: updatedSong, error: songsErr } = await supabase
      .from('songs')
      .update(songUpdateBody)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!songsErr && updatedSong) {
      return { success: true, data: normalizeSong(updatedSong) };
    }

    // 2. Fallback: Attempt update in 'chords' table
    const chordUpdateBody: Record<string, any> = {
      title: payload.title?.trim(),
      artist: payload.artist?.trim(),
      content: chordsContent,
      cover_url: payload.cover_url || null,
      difficulty: payload.difficulty || null,
      youtube_video_id: payload.youtube_video_id || null,
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
      .select('*')
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
