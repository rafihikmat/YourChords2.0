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
 * Fetch list of song notes created by current user
 */
export async function getUserNotesList(userId: string): Promise<UserSongNoteItem[]> {
  if (!userId || userId === 'guest' || userId === 'demo-user') {
    return [];
  }

  try {
    // Primary query with JOIN to songs & albums
    const { data: joinedData, error: joinErr } = await supabase
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

    if (!joinErr && joinedData && joinedData.length > 0) {
      return joinedData.map((item: any) => {
        const rawSong = item.songs;
        let songObj: Song | null = null;

        if (rawSong) {
          const albumCover = rawSong.albums?.cover_url || rawSong.cover_url || '';
          songObj = normalizeSong({
            ...rawSong,
            cover_url: albumCover,
          });
        }

        const content = item.notes_content || item.note || item.content || '';
        return {
          id: item.id,
          song_id: item.song_id,
          notes_content: content,
          updated_at: item.updated_at || new Date().toISOString(),
          song: songObj,
        };
      });
    }

    // Fallback if joined query returns empty or fails
    const { data: notesData, error: notesErr } = await supabase
      .from('user_song_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (notesErr || !notesData || notesData.length === 0) {
      return [];
    }

    const songIds = Array.from(new Set(notesData.map((n: any) => n.song_id).filter(Boolean)));

    let songsMap: Record<string, Song> = {};

    if (songIds.length > 0) {
      const { data: songsData } = await supabase
        .from('songs')
        .select('*, albums(cover_url)')
        .in('id', songIds);

      if (songsData) {
        songsData.forEach((rawSong: any) => {
          songsMap[rawSong.id] = normalizeSong(rawSong);
        });
      }

      // Fallback to chords table for missing songs
      const missingIds = songIds.filter(id => !songsMap[id]);
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

    return notesData.map((noteItem: any) => {
      const content = noteItem.notes_content || noteItem.note || noteItem.content || '';
      return {
        id: noteItem.id,
        song_id: noteItem.song_id,
        notes_content: content,
        updated_at: noteItem.updated_at || noteItem.created_at || new Date().toISOString(),
        song: songsMap[noteItem.song_id] || null,
      };
    });
  } catch (err) {
    console.error('[GET USER NOTES LIST ERROR]:', err);
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
