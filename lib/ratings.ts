import { supabase } from '@/lib/supabase';

export interface SongRatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
}

export interface DifficultyStatsData {
  totalVotes: number;
  counts: {
    sangat_mudah: number;
    mudah: number;
    sedang: number;
    sulit: number;
  };
  percentages: {
    sangat_mudah: number;
    mudah: number;
    sedang: number;
    sulit: number;
  };
  userVote?: string; // 'sangat_mudah' | 'mudah' | 'sedang' | 'sulit'
}

export interface DifficultyVoteData {
  votes: {
    'Sangat Mudah': number;
    'Mudah': number;
    'Sedang': number;
    'Sulit': number;
  };
  totalVotes: number;
  userVote?: string;
  percentages: {
    'Sangat Mudah': number;
    'Mudah': number;
    'Sedang': number;
    'Sulit': number;
  };
}

export interface SongRatingModerationItem {
  song_id: string;
  title: string;
  artist: string;
  averageRating: number;
  totalRatings: number;
  totalDifficultyVotes: number;
  difficultyBreakdown: {
    'Sangat Mudah': number;
    'Mudah': number;
    'Sedang': number;
    'Sulit': number;
  };
}

// Normalizer for Difficulty Categories
function normalizeDifficultyLabel(val?: string): 'Sangat Mudah' | 'Mudah' | 'Sedang' | 'Sulit' | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim().replace(/_/g, ' ');
  if (lower.includes('sangat mudah')) return 'Sangat Mudah';
  if (lower.includes('mudah')) return 'Mudah';
  if (lower.includes('sedang')) return 'Sedang';
  if (lower.includes('sulit')) return 'Sulit';
  return null;
}

/**
 * Fetch real-time star ratings for a song from Supabase (Zero dummy fallback).
 */
export async function getSongRating(songId: string, userId?: string): Promise<SongRatingData> {
  try {
    const { data, error } = await supabase
      .from('song_ratings')
      .select('rating, user_id')
      .eq('song_id', songId);

    if (error || !data || data.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        userRating: undefined,
      };
    }

    const totalRatings = data.length;
    const sum = data.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
    const averageRating = Number((sum / totalRatings).toFixed(1));
    const userRatingObj = userId ? data.find((r) => r.user_id === userId) : undefined;

    return {
      averageRating,
      totalRatings,
      userRating: userRatingObj ? Number(userRatingObj.rating) : undefined,
    };
  } catch (err) {
    console.warn('[RATINGS GET ERROR]:', err);
    return { averageRating: 0, totalRatings: 0 };
  }
}

/**
 * Submit or update a star rating in Supabase using upsert.
 */
export async function submitSongRating(songId: string, rating: number, userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('song_ratings')
      .upsert(
        { song_id: songId, user_id: userId, rating },
        { onConflict: 'song_id,user_id' }
      );

    if (error) {
      console.warn('[RATING UPSERT WARN]:', error.message);
      // Fallback insert if constraint differs
      await supabase.from('song_ratings').insert({ song_id: songId, user_id: userId, rating });
    }
    return true;
  } catch (err) {
    console.error('[RATING SUBMIT ERROR]:', err);
    return false;
  }
}

/**
 * Submit or update a difficulty vote in song_difficulty_votes table using upsert.
 */
export async function voteSongDifficulty(songId: string, userId: string, vote: string): Promise<boolean> {
  if (!songId || !userId || !vote) {
    throw new Error('Paramater songId, userId, dan vote wajib diisi.');
  }

  // Normalize vote value to one of: 'sangat_mudah', 'mudah', 'sedang', 'sulit'
  let normalizedVote = vote.toLowerCase().trim().replace(/\s+/g, '_');
  if (normalizedVote.includes('sangat')) normalizedVote = 'sangat_mudah';
  else if (normalizedVote.includes('mudah')) normalizedVote = 'mudah';
  else if (normalizedVote.includes('sedang')) normalizedVote = 'sedang';
  else if (normalizedVote.includes('sulit')) normalizedVote = 'sulit';
  else normalizedVote = 'sedang';

  const now = new Date().toISOString();

  // Try upsert on 'user_id, song_id'
  const { error } = await supabase
    .from('song_difficulty_votes')
    .upsert(
      { song_id: songId, user_id: userId, vote: normalizedVote, created_at: now },
      { onConflict: 'user_id, song_id' }
    );

  if (error) {
    // Retry with 'song_id, user_id' or standard insert
    const { error: err2 } = await supabase
      .from('song_difficulty_votes')
      .upsert(
        { song_id: songId, user_id: userId, vote: normalizedVote, created_at: now },
        { onConflict: 'song_id, user_id' }
      );

    if (err2) {
      throw new Error(`Gagal menyimpan suara tingkat kesulitan: ${err2.message || error.message}`);
    }
  }

  return true;
}

/**
 * Fetch difficulty voting stats for a song.
 */
export async function getSongDifficultyStats(songId: string, userId?: string): Promise<DifficultyStatsData> {
  const counts = {
    sangat_mudah: 0,
    mudah: 0,
    sedang: 0,
    sulit: 0,
  };

  try {
    const { data, error } = await supabase
      .from('song_difficulty_votes')
      .select('*')
      .eq('song_id', songId);

    if (error || !data || data.length === 0) {
      return {
        totalVotes: 0,
        counts,
        percentages: {
          sangat_mudah: 0,
          mudah: 0,
          sedang: 0,
          sulit: 0,
        },
        userVote: undefined,
      };
    }

    let userVote: string | undefined = undefined;

    data.forEach((row: any) => {
      let raw = (row.vote || row.difficulty || '').toLowerCase().trim().replace(/\s+/g, '_');
      if (raw.includes('sangat')) raw = 'sangat_mudah';
      else if (raw.includes('mudah')) raw = 'mudah';
      else if (raw.includes('sedang')) raw = 'sedang';
      else if (raw.includes('sulit')) raw = 'sulit';

      if (raw in counts) {
        counts[raw as keyof typeof counts]++;
      }

      if (userId && row.user_id === userId) {
        userVote = raw;
      }
    });

    const totalVotes = data.length;
    const percentages = {
      sangat_mudah: totalVotes > 0 ? Math.round((counts.sangat_mudah / totalVotes) * 100) : 0,
      mudah: totalVotes > 0 ? Math.round((counts.mudah / totalVotes) * 100) : 0,
      sedang: totalVotes > 0 ? Math.round((counts.sedang / totalVotes) * 100) : 0,
      sulit: totalVotes > 0 ? Math.round((counts.sulit / totalVotes) * 100) : 0,
    };

    return {
      totalVotes,
      counts,
      percentages,
      userVote,
    };
  } catch (err) {
    console.warn('[GET SONG DIFFICULTY STATS ERROR]:', err);
    return {
      totalVotes: 0,
      counts,
      percentages: {
        sangat_mudah: 0,
        mudah: 0,
        sedang: 0,
        sulit: 0,
      },
      userVote: undefined,
    };
  }
}

/**
 * Fetch real-time community difficulty voting data from Supabase (Zero dummy fallback).
 */
export async function getDifficultyVotes(songId: string, userId?: string): Promise<DifficultyVoteData> {
  const stats = await getSongDifficultyStats(songId, userId);
  const labelMap: Record<string, string> = {
    sangat_mudah: 'Sangat Mudah',
    mudah: 'Mudah',
    sedang: 'Sedang',
    sulit: 'Sulit',
  };

  return {
    votes: {
      'Sangat Mudah': stats.counts.sangat_mudah,
      'Mudah': stats.counts.mudah,
      'Sedang': stats.counts.sedang,
      'Sulit': stats.counts.sulit,
    },
    totalVotes: stats.totalVotes,
    userVote: stats.userVote ? labelMap[stats.userVote] || stats.userVote : undefined,
    percentages: {
      'Sangat Mudah': stats.percentages.sangat_mudah,
      'Mudah': stats.percentages.mudah,
      'Sedang': stats.percentages.sedang,
      'Sulit': stats.percentages.sulit,
    },
  };
}

/**
 * Submit or update a community difficulty vote in Supabase using upsert.
 */
export async function submitDifficultyVote(songId: string, difficulty: string, userId: string): Promise<boolean> {
  try {
    await voteSongDifficulty(songId, userId, difficulty);
    return true;
  } catch (err) {
    console.error('[DIFFICULTY SUBMIT ERROR]:', err);
    return false;
  }
}

/**
 * Admin Moderation Helper: Get all song ratings & votes aggregated for admin overview.
 */
export async function getAdminRatingsOverview(): Promise<SongRatingModerationItem[]> {
  try {
    // 1. Fetch songs
    let songsData: any[] = [];
    const { data: songs, error: songsErr } = await supabase
      .from('songs')
      .select('id, title, artist');

    if (!songsErr && songs && songs.length > 0) {
      songsData = songs;
    } else {
      const { data: chords } = await supabase.from('chords').select('id, title, artist');
      if (chords) songsData = chords;
    }

    if (songsData.length === 0) return [];

    // 2. Fetch all ratings
    const { data: allRatings } = await supabase.from('song_ratings').select('song_id, rating');

    // 3. Fetch all difficulty votes
    const { data: allVotes } = await supabase.from('song_difficulty_votes').select('song_id, difficulty, vote');

    // Group ratings by song_id
    const ratingsMap: Record<string, number[]> = {};
    if (allRatings) {
      allRatings.forEach((r: any) => {
        if (!ratingsMap[r.song_id]) ratingsMap[r.song_id] = [];
        ratingsMap[r.song_id].push(Number(r.rating) || 0);
      });
    }

    // Group votes by song_id
    const votesMap: Record<string, { 'Sangat Mudah': number; 'Mudah': number; 'Sedang': number; 'Sulit': number }> = {};
    if (allVotes) {
      allVotes.forEach((v: any) => {
        if (!votesMap[v.song_id]) {
          votesMap[v.song_id] = { 'Sangat Mudah': 0, 'Mudah': 0, 'Sedang': 0, 'Sulit': 0 };
        }
        const norm = normalizeDifficultyLabel(v.vote || v.difficulty);
        if (norm && votesMap[v.song_id][norm] !== undefined) {
          votesMap[v.song_id][norm]++;
        }
      });
    }

    return songsData.map((s) => {
      const rArr = ratingsMap[s.id] || [];
      const totalRatings = rArr.length;
      const sum = rArr.reduce((a, b) => a + b, 0);
      const averageRating = totalRatings > 0 ? Number((sum / totalRatings).toFixed(1)) : 0;

      const vObj = votesMap[s.id] || { 'Sangat Mudah': 0, 'Mudah': 0, 'Sedang': 0, 'Sulit': 0 };
      const totalDifficultyVotes = vObj['Sangat Mudah'] + vObj['Mudah'] + vObj['Sedang'] + vObj['Sulit'];

      return {
        song_id: s.id,
        title: s.title || 'Tanpa Judul',
        artist: s.artist || 'Tanpa Artis',
        averageRating,
        totalRatings,
        totalDifficultyVotes,
        difficultyBreakdown: vObj,
      };
    });
  } catch (err) {
    console.error('[GET ADMIN RATINGS OVERVIEW ERROR]:', err);
    return [];
  }
}

/**
 * Reset all ratings and difficulty votes for a specific song (Admin Moderation).
 */
export async function resetSongRatingsAndVotes(songId: string): Promise<boolean> {
  try {
    await Promise.all([
      supabase.from('song_ratings').delete().eq('song_id', songId),
      supabase.from('song_difficulty_votes').delete().eq('song_id', songId),
    ]);
    return true;
  } catch (err) {
    console.error('[RESET RATINGS ERROR]:', err);
    return false;
  }
}
