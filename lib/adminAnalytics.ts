import { supabase } from '@/lib/supabase';

export interface AdminOverviewStats {
  totalSongs: number;
  totalViews: number;
  totalMissingRequests: number;
  totalUsers: number;
}

export interface MissingSongItem {
  id?: string;
  query: string;
  count: number;
  last_searched_at: string;
}

/**
 * Mengambil ringkasan data statistik platform dari Supabase:
 * 1. Total Lagu di database ('songs' atau 'chords')
 * 2. Total Pageviews kumulatif
 * 3. Total Kata Kunci Pencarian Kosong ('missing_songs_log' atau 'search_logs')
 * 4. Total Pengguna Terdaftar ('profiles')
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  let totalSongs = 0;
  let totalViews = 0;
  let totalMissingRequests = 0;
  let totalUsers = 0;

  try {
    // 1. Total Lagu & Total Views
    const { data: songsData, count: songsCount, error: songsErr } = await supabase
      .from('songs')
      .select('view_count', { count: 'exact' });

    if (!songsErr && songsData) {
      totalSongs = songsCount ?? songsData.length;
      totalViews = songsData.reduce((acc, curr) => acc + (Number(curr.view_count) || 0), 0);
    } else {
      // Fallback ke tabel 'chords'
      const { data: chordsData, count: chordsCount } = await supabase
        .from('chords')
        .select('views', { count: 'exact' });

      if (chordsData) {
        totalSongs = chordsCount ?? chordsData.length;
        totalViews = chordsData.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
      }
    }

    // 2. Permintaan Lagu Kosong (Missing Songs)
    const { data: missingData, error: missingErr } = await supabase
      .from('missing_songs_log')
      .select('count');

    if (!missingErr && missingData) {
      totalMissingRequests = missingData.reduce((acc, curr) => acc + (Number(curr.count) || 1), 0);
    } else {
      const { data: searchLogsData } = await supabase
        .from('search_logs')
        .select('count');

      if (searchLogsData) {
        totalMissingRequests = searchLogsData.reduce((acc, curr) => acc + (Number(curr.count) || 1), 0);
      }
    }

    // 3. Total Pengguna Terdaftar
    const { count: usersCount, error: usersErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!usersErr && usersCount !== null) {
      totalUsers = usersCount;
    } else {
      const { data: profilesData } = await supabase.from('profiles').select('id');
      if (profilesData) {
        totalUsers = profilesData.length;
      }
    }
  } catch (err) {
    console.error('[ADMIN OVERVIEW STATS ERROR]:', err);
  }

  return {
    totalSongs,
    totalViews,
    totalMissingRequests,
    totalUsers,
  };
}

/**
 * Mengambil daftar kata kunci pencarian yang paling banyak dicari pengguna tetapi belum ada di database,
 * diurutkan berdasarkan 'count' tertinggi.
 */
export async function getTopMissingSongs(limit = 10): Promise<MissingSongItem[]> {
  try {
    // 1. Coba di tabel 'missing_songs_log'
    const { data: missingData, error: missingErr } = await supabase
      .from('missing_songs_log')
      .select('*')
      .order('count', { ascending: false })
      .limit(limit);

    if (!missingErr && missingData && missingData.length > 0) {
      return missingData.map((item: any) => ({
        id: item.id || item.query,
        query: item.query,
        count: item.count || 1,
        last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
      }));
    }

    // 2. Fallback ke tabel 'search_logs'
    const { data: searchData, error: searchErr } = await supabase
      .from('search_logs')
      .select('*')
      .order('count', { ascending: false })
      .limit(limit);

    if (!searchErr && searchData && searchData.length > 0) {
      return searchData.map((item: any) => ({
        id: item.id || item.query,
        query: item.query,
        count: item.count || 1,
        last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.error('[GET TOP MISSING SONGS ERROR]:', err);
  }

  return [];
}
