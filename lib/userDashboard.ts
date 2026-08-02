import { supabase, normalizeSong } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { getUserFavorites } from '@/lib/setlists';

export interface UserDashboardStats {
  favoritesCount: number;
  setlistsCount: number;
  notesCount: number;
}

export interface UserSongNoteItem {
  id: string;
  song_id: string;
  notes_content: string;
  updated_at: string;
  song?: Song | null;
}

export interface UserSetlistWithItems {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  song_ids: string[];
  songs: Song[];
}

/**
 * Fetch total counts of user favorites, setlists, and song notes.
 */
export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return { favoritesCount: 0, setlistsCount: 0, notesCount: 0 };
  }

  try {
    // 1. Favorites count
    let favoritesCount = 0;
    const { count: favCount1 } = await supabase
      .from('user_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: favCount2 } = await supabase
      .from('song_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    favoritesCount = Math.max(favCount1 || 0, favCount2 || 0);
    if ((favCount1 || 0) > 0 && (favCount2 || 0) > 0) {
      // If both tables have records, get unique song_id count
      const { data: f1 } = await supabase.from('user_favorites').select('song_id').eq('user_id', userId);
      const { data: f2 } = await supabase.from('song_favorites').select('song_id').eq('user_id', userId);
      const set = new Set([...(f1 || []).map(x => x.song_id), ...(f2 || []).map(x => x.song_id)].filter(Boolean));
      favoritesCount = set.size;
    }

    // 2. Setlists count
    let setlistsCount = 0;
    const { count: setCount1 } = await supabase
      .from('setlists')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: setCount2 } = await supabase
      .from('user_setlists')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    setlistsCount = Math.max(setCount1 || 0, setCount2 || 0);

    // 3. Song notes count
    const { count: notesCount } = await supabase
      .from('user_song_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      favoritesCount,
      setlistsCount,
      notesCount: notesCount || 0,
    };
  } catch (err) {
    console.error('[GET USER DASHBOARD STATS ERROR]:', err);
    return { favoritesCount: 0, setlistsCount: 0, notesCount: 0 };
  }
}

/**
 * Fetch favorite songs for current user
 */
export async function getUserFavoriteSongs(userId: string): Promise<Song[]> {
  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('song_favorites')
      .select(`
        created_at,
        song_id,
        songs:song_id (
          id,
          title,
          artist,
          difficulty,
          view_count,
          key_chord,
          content,
          youtube_video_id,
          albums:album_id (cover_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const favSongs: Song[] = [];
      data.forEach((item: any) => {
        const rawSong = item.songs;
        if (rawSong) {
          const albumCover = rawSong.albums?.cover_url || rawSong.cover_url || '';
          favSongs.push(
            normalizeSong({
              ...rawSong,
              cover_url: albumCover,
            })
          );
        }
      });
      if (favSongs.length > 0) return favSongs;
    }

    // Fallback if song_favorites returned nothing, check user_favorites
    const { data: altData } = await supabase
      .from('user_favorites')
      .select(`
        created_at,
        song_id,
        songs:song_id (
          id,
          title,
          artist,
          difficulty,
          view_count,
          key_chord,
          content,
          youtube_video_id,
          albums:album_id (cover_url)
        )
      `)
      .eq('user_id', userId);

    if (altData && altData.length > 0) {
      const favSongs: Song[] = [];
      altData.forEach((item: any) => {
        const rawSong = item.songs;
        if (rawSong) {
          const albumCover = rawSong.albums?.cover_url || rawSong.cover_url || '';
          favSongs.push(
            normalizeSong({
              ...rawSong,
              cover_url: albumCover,
            })
          );
        }
      });
      if (favSongs.length > 0) return favSongs;
    }

    // Fallback: fetch using getUserFavorites(userId) from lib/setlists
    const legacyFavs = await getUserFavorites(userId);
    return legacyFavs;
  } catch (err) {
    console.error('[GET USER FAVORITE SONGS ERROR]:', err);
    return [];
  }
}

/**
 * Upsert personal notes & strumming pattern for a song.
 */
export async function saveUserSongNote(userId: string, songId: string, notesContent: string) {
  try {
    if (!userId || !songId) throw new Error('User ID dan Song ID wajib diisi.');

    const { data, error } = await supabase
      .from('user_song_notes')
      .upsert(
        {
          user_id: userId,
          song_id: songId,
          notes_content: notesContent.trim(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id, song_id' }
      )
      .select();

    if (error) {
      console.error('[SAVE NOTE ERROR]:', error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan catatan.' };
  }
}

/**
 * Fetch list of song notes created by current user
 */
export async function getUserNotesList(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_song_notes')
      .select(`
        id,
        notes_content,
        updated_at,
        song_id,
        songs:song_id (
          id,
          title,
          artist,
          difficulty,
          albums:album_id (cover_url)
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      song_id: item.song_id,
      notes_content: item.notes_content,
      updated_at: item.updated_at,
      title: item.songs?.title || 'Judul Lagu',
      artist: item.songs?.artist || 'Artis',
      difficulty: item.songs?.difficulty || 'sedang',
      cover_url: item.songs?.albums?.cover_url || null,
      song: item.songs ? {
        id: item.songs.id,
        title: item.songs.title,
        artist: item.songs.artist,
        difficulty: item.songs.difficulty,
        cover_url: item.songs.albums?.cover_url || null
      } : null
    }));
  } catch (err) {
    console.error('[GET USER NOTES ERROR]:', err);
    return [];
  }
}

/**
 * Fetch setlists with full song items for current user
 */
export async function getUserSetlistsWithItems(userId: string): Promise<UserSetlistWithItems[]> {
  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return [];
  }

  try {
    // 1. Fetch setlists folders
    let setlistFolders: any[] = [];
    
    const { data: userSetlists, error: userErr } = await supabase
      .from('user_setlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!userErr && userSetlists) {
      setlistFolders = userSetlists;
    }

    const { data: setlists, error: setErr } = await supabase
      .from('setlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!setErr && setlists && setlists.length > 0) {
      // Merge unique setlists
      const existingIds = new Set(setlistFolders.map(s => s.id));
      setlists.forEach(s => {
        if (!existingIds.has(s.id)) {
          setlistFolders.push(s);
        }
      });
    }

    if (setlistFolders.length === 0) {
      return [];
    }

    // 2. Collect all song_ids from setlists & setlist_items table if present
    const setlistIds = setlistFolders.map(f => f.id);

    let setlistItemsMap: Record<string, string[]> = {};
    setlistFolders.forEach(f => {
      setlistItemsMap[f.id] = Array.isArray(f.song_ids) ? f.song_ids : [];
    });

    // Also check setlist_items table if it exists
    const { data: itemsData } = await supabase
      .from('setlist_items')
      .select('setlist_id, song_id')
      .in('setlist_id', setlistIds);

    if (itemsData && itemsData.length > 0) {
      itemsData.forEach((item: any) => {
        if (item.setlist_id && item.song_id) {
          if (!setlistItemsMap[item.setlist_id]) {
            setlistItemsMap[item.setlist_id] = [];
          }
          if (!setlistItemsMap[item.setlist_id].includes(item.song_id)) {
            setlistItemsMap[item.setlist_id].push(item.song_id);
          }
        }
      });
    }

    // Collect all unique song IDs across setlists
    const allSongIds = Array.from(new Set(Object.values(setlistItemsMap).flat().filter(Boolean)));

    let songsMap: Record<string, Song> = {};
    if (allSongIds.length > 0) {
      const { data: songsData } = await supabase
        .from('songs')
        .select('*, albums:album_id (cover_url)')
        .in('id', allSongIds);

      if (songsData) {
        songsData.forEach((rawSong: any) => {
          songsMap[rawSong.id] = normalizeSong(rawSong);
        });
      }

      // Fallback chords table
      const missingIds = allSongIds.filter(id => !songsMap[id]);
      if (missingIds.length > 0) {
        const { data: chordsData } = await supabase
          .from('chords')
          .select('*')
          .in('id', missingIds);

        if (chordsData) {
          chordsData.forEach((rawSong: any) => {
            songsMap[rawSong.id] = normalizeSong(rawSong);
          });
        }
      }
    }

    return setlistFolders.map((folder: any) => {
      const ids: string[] = setlistItemsMap[folder.id] || [];
      const songs = ids.map(id => songsMap[id]).filter(Boolean);
      return {
        id: folder.id,
        user_id: folder.user_id,
        name: folder.name || 'Setlist Tanpa Nama',
        description: folder.description || '',
        created_at: folder.created_at || new Date().toISOString(),
        song_ids: ids,
        songs,
      };
    });
  } catch (err) {
    console.error('[GET USER SETLISTS WITH ITEMS ERROR]:', err);
    return [];
  }
}

/**
 * Update user display name in profiles table
 */
export async function updateUserProfileName(userId: string, fullName: string): Promise<boolean> {
  if (!userId || !fullName.trim()) return false;

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName.trim(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[UPDATE PROFILE NAME ERROR]:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[UPDATE PROFILE NAME EXCEPTION]:', err);
    return false;
  }
}
