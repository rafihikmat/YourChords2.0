import { supabase } from '@/lib/supabase';

const LOCAL_FAVORITES_KEY = 'yourchords_favorites';
const LOCAL_NOTES_KEY = 'yourchords_user_notes';

function getLocalFavs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function setLocalFavs(favs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favs));
  } catch (err) {
    console.warn('[LOCAL STORAGE FAV SAVE WARN]:', err);
  }
}

function getLocalNote(songId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const map = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '{}');
    return map[songId] || '';
  } catch {
    return '';
  }
}

function setLocalNote(songId: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    const map = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '{}');
    if (text && text.trim()) {
      map[songId] = text;
    } else {
      delete map[songId];
    }
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[LOCAL STORAGE NOTE SAVE WARN]:', err);
  }
}

/* Helper to disambiguate userId vs songId */
function parseUserAndSongIds(a1?: string, a2?: string): { userId?: string; songId: string } {
  if (!a1) return { songId: '' };
  // If a2 is provided and a1 is "guest" or looks like user id
  if (a1 === 'guest' || a1 === 'demo-user') {
    return { userId: a1, songId: a2 || '' };
  }
  if (a2 === 'guest' || a2 === 'demo-user') {
    return { userId: a2, songId: a1 };
  }
  // Standard (songId, userId)
  return { songId: a1, userId: a2 };
}

/* ====================================================================
   1. PERSONAL NOTES & STRUMMING PATTERN ENGINE
==================================================================== */

/**
 * Fetch personal notes / strumming pattern written by user for a song.
 * Supports both getUserSongNote(songId, userId) and getUserSongNote(userId, songId).
 */
export async function getUserSongNote(arg1: string, arg2?: string): Promise<string> {
  const { songId, userId } = parseUserAndSongIds(arg1, arg2);
  if (!songId || !userId || userId === 'guest' || userId === 'demo-user') {
    return '';
  }

  try {
    const { data, error } = await supabase
      .from('user_song_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (!error && data) {
      const content = data.notes_content || data.note || data.content || '';
      if (content) return content;
    }

    return '';
  } catch (err) {
    console.warn('[GET USER SONG NOTE ERROR]:', err);
    return '';
  }
}

/**
 * Save / Update (upsert) personal notes & strumming pattern for a song.
 * Signature: saveUserSongNote(songId, notesContent, userId) or saveUserSongNote(userId, songId, notesContent)
 */
export async function saveUserSongNote(
  arg1: string,
  arg2: string,
  arg3?: string
): Promise<boolean> {
  let songId = arg1;
  let notesContent = arg2;
  let userId = arg3;

  // Handle saveUserSongNote(userId, songId, noteText)
  if (arg3 !== undefined && (arg1 === 'guest' || arg1 === 'demo-user' || (arg2.length < 50 && arg3.length > 50))) {
    userId = arg1;
    songId = arg2;
    notesContent = arg3;
  }

  if (!songId || !userId || userId === 'guest' || userId === 'demo-user') {
    return false;
  }

  try {
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('user_song_notes')
      .select('id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('user_song_notes')
        .update({
          notes_content: notesContent,
          note: notesContent,
          updated_at: now,
        })
        .eq('id', existing.id);

      if (updateErr) {
        await supabase
          .from('user_song_notes')
          .update({ note: notesContent, updated_at: now })
          .eq('id', existing.id);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('user_song_notes')
        .insert({
          user_id: userId,
          song_id: songId,
          notes_content: notesContent,
          note: notesContent,
          created_at: now,
          updated_at: now,
        });

      if (insertErr) {
        await supabase
          .from('user_song_notes')
          .insert({
            user_id: userId,
            song_id: songId,
            note: notesContent,
          });
      }
    }

    return true;
  } catch (err) {
    console.error('[SAVE USER SONG NOTE ERROR]:', err);
    return false;
  }
}

/* ====================================================================
   2. REAL-TIME LIKE / FAVORITE TOGGLE SYSTEM
==================================================================== */

/**
 * Check if song is liked / favorited by current user.
 */
export async function checkIsSongLiked(arg1: string, arg2?: string): Promise<boolean> {
  const { songId, userId } = parseUserAndSongIds(arg1, arg2);
  if (!songId) return false;

  const localFavs = getLocalFavs();

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return localFavs.includes(songId);
  }

  try {
    const { data: songFav } = await supabase
      .from('song_favorites')
      .select('song_id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (songFav) return true;

    const { data: userFav } = await supabase
      .from('user_favorites')
      .select('song_id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();

    if (userFav) return true;

    return localFavs.includes(songId);
  } catch (err) {
    console.warn('[CHECK IS SONG LIKED WARN]:', err);
    return localFavs.includes(songId);
  }
}

export const checkIsFavorite = checkIsSongLiked;

/**
 * Toggle favorite status (adds if not favorited, removes if favorited).
 * Returns the new favorited boolean status.
 */
export async function toggleSongFavorite(arg1: string, arg2?: string): Promise<boolean> {
  const { songId, userId } = parseUserAndSongIds(arg1, arg2);
  if (!songId) return false;

  const localFavs = getLocalFavs();
  const isCurrentlyFav = localFavs.includes(songId);
  let updatedFavs: string[];

  if (isCurrentlyFav) {
    updatedFavs = localFavs.filter(id => id !== songId);
  } else {
    updatedFavs = [...localFavs, songId];
  }
  setLocalFavs(updatedFavs);

  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return !isCurrentlyFav;
  }

  try {
    const isLiked = await checkIsSongLiked(songId, userId);

    if (isLiked) {
      await supabase.from('song_favorites').delete().eq('user_id', userId).eq('song_id', songId);
      await supabase.from('user_favorites').delete().eq('user_id', userId).eq('song_id', songId);
      return false;
    } else {
      const now = new Date().toISOString();
      await supabase.from('song_favorites').insert({ user_id: userId, song_id: songId, created_at: now });
      try {
        await supabase.from('user_favorites').insert({ user_id: userId, song_id: songId });
      } catch {
        // user_favorites table optional sync
      }
      return true;
    }
  } catch (err) {
    console.warn('[TOGGLE SONG FAVORITE WARN]:', err);
    return !isCurrentlyFav;
  }
}
