import { supabase } from '@/lib/supabase';

export interface AdminOverviewStats {
  totalSongs: number;
  totalViews: number;
  totalMissingRequests: number;
  totalUsers: number;
}

export interface MissingSongLogItem {
  id?: string;
  keyword: string;
  query?: string;
  search_count: number;
  count?: number;
  last_searched_at: string;
}

export type MissingSongItem = MissingSongLogItem;

/**
 * PURE REAL-TIME STATS ENGINE:
 * 1. TOTAL KOLEKSI LAGU (Count exact from 'songs')
 * 2. TOTAL VIEW LAGU (Agregasi view_count seluruh lagu)
 * 3. PERMINTAAN LAGU KOSONG (Count exact from 'missing_songs_log')
 * 4. PENGGUNA TERDAFTAR (Count exact from 'profiles')
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  let totalSongs = 0;
  let totalViews = 0;
  let totalMissingRequests = 0;
  let totalUsers = 0;

  try {
    // 1. TOTAL KOLEKSI LAGU
    const { count: songsCount, error: songsCountErr } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true });

    if (!songsCountErr && songsCount !== null) {
      totalSongs = songsCount;
    } else {
      const { count: chordsCount } = await supabase
        .from('chords')
        .select('*', { count: 'exact', head: true });
      if (chordsCount !== null) totalSongs = chordsCount;
    }

    // 2. TOTAL VIEW LAGU
    const { data: songsViewsData } = await supabase
      .from('songs')
      .select('view_count');

    if (songsViewsData && songsViewsData.length > 0) {
      totalViews = songsViewsData.reduce((acc, curr) => acc + (Number(curr.view_count) || 0), 0);
    } else {
      const { data: chordsViewsData } = await supabase
        .from('chords')
        .select('views');
      if (chordsViewsData && chordsViewsData.length > 0) {
        totalViews = chordsViewsData.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
      }
    }

    // 3. PERMINTAAN LAGU KOSONG (Missing Search Requests)
    const { count: missingCount, error: missingErr } = await supabase
      .from('missing_songs_log')
      .select('*', { count: 'exact', head: true });

    if (!missingErr && missingCount !== null) {
      totalMissingRequests = missingCount;
    } else {
      const { data: missingSumData } = await supabase
        .from('missing_songs_log')
        .select('search_count, count');

      if (missingSumData && missingSumData.length > 0) {
        totalMissingRequests = missingSumData.reduce(
          (acc, curr) => acc + (Number(curr.search_count || curr.count) || 1),
          0
        );
      } else {
        const { count: searchCount } = await supabase
          .from('search_logs')
          .select('*', { count: 'exact', head: true });
        if (searchCount !== null) totalMissingRequests = searchCount;
      }
    }

    // 4. PENGGUNA TERDAFTAR (Registered Members)
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
 * Fetch all missing songs requests ordered by search_count descending.
 */
export async function getMissingSongsLog(limit = 50): Promise<MissingSongLogItem[]> {
  try {
    let { data: missingData, error: missingErr } = await supabase
      .from('missing_songs_log')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(limit);

    if (missingErr || !missingData || missingData.length === 0) {
      const { data: missingDataByCount, error: err2 } = await supabase
        .from('missing_songs_log')
        .select('*')
        .order('count', { ascending: false })
        .limit(limit);

      if (!err2 && missingDataByCount && missingDataByCount.length > 0) {
        missingData = missingDataByCount;
        missingErr = null;
      }
    }

    if (!missingErr && missingData && missingData.length > 0) {
      return missingData.map((item: any) => {
        const kw = item.keyword || item.query || 'Lagu Tidak Dikenal';
        return {
          id: item.id || kw,
          keyword: kw,
          query: kw,
          search_count: Number(item.search_count || item.count || 1),
          count: Number(item.search_count || item.count || 1),
          last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
        };
      });
    }

    // Fallback to search_logs
    const { data: searchData, error: searchErr } = await supabase
      .from('search_logs')
      .select('*')
      .order('count', { ascending: false })
      .limit(limit);

    if (!searchErr && searchData && searchData.length > 0) {
      return searchData.map((item: any) => {
        const kw = item.query || 'Lagu Tidak Dikenal';
        return {
          id: item.id || kw,
          keyword: kw,
          query: kw,
          search_count: Number(item.count || 1),
          count: Number(item.count || 1),
          last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
        };
      });
    }
  } catch (err) {
    console.error('[GET MISSING SONGS LOG ERROR]:', err);
  }

  return [];
}

export const getTopMissingSongs = getMissingSongsLog;
