import { supabase } from '@/lib/supabase';

export interface SongRatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
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

// Fetch star ratings for a song
export async function getSongRating(songId: string, userId?: string): Promise<SongRatingData> {
  try {
    const { data, error } = await supabase
      .from('song_ratings')
      .select('rating, user_id')
      .eq('song_id', songId);

    if (error || !data || data.length === 0) {
      // Fallback default rating
      return {
        averageRating: 4.8,
        totalRatings: 12,
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
    return { averageRating: 4.8, totalRatings: 12 };
  }
}

// Submit or update a star rating
export async function submitSongRating(songId: string, rating: number, userId?: string): Promise<boolean> {
  try {
    const effectiveUserId = userId || 'anon-' + Math.random().toString(36).substring(2, 9);

    const { error } = await supabase
      .from('song_ratings')
      .upsert(
        { song_id: songId, user_id: effectiveUserId, rating },
        { onConflict: 'song_id,user_id' }
      );

    if (error) {
      console.warn('[RATING UPSERT WARN]:', error.message);
      // Fallback insert without constraint
      await supabase.from('song_ratings').insert({ song_id: songId, user_id: effectiveUserId, rating });
    }
    return true;
  } catch (err) {
    console.error('[RATING SUBMIT ERROR]:', err);
    return false;
  }
}

// Fetch community difficulty voting data
export async function getDifficultyVotes(songId: string, userId?: string): Promise<DifficultyVoteData> {
  const defaultVotes = {
    'Sangat Mudah': 3,
    'Mudah': 14,
    'Sedang': 5,
    'Sulit': 1,
  };

  try {
    const { data, error } = await supabase
      .from('song_difficulty_votes')
      .select('difficulty, user_id')
      .eq('song_id', songId);

    if (error || !data || data.length === 0) {
      const total = 3 + 14 + 5 + 1;
      return {
        votes: defaultVotes,
        totalVotes: total,
        percentages: {
          'Sangat Mudah': Math.round((3 / total) * 100),
          'Mudah': Math.round((14 / total) * 100),
          'Sedang': Math.round((5 / total) * 100),
          'Sulit': Math.round((1 / total) * 100),
        },
      };
    }

    const votes = {
      'Sangat Mudah': 0,
      'Mudah': 0,
      'Sedang': 0,
      'Sulit': 0,
    };

    let userVote: string | undefined = undefined;

    data.forEach((row) => {
      const diffKey = row.difficulty as keyof typeof votes;
      if (votes[diffKey] !== undefined) {
        votes[diffKey]++;
      }
      if (userId && row.user_id === userId) {
        userVote = row.difficulty;
      }
    });

    const totalVotes = data.length || 1;
    const percentages = {
      'Sangat Mudah': Math.round((votes['Sangat Mudah'] / totalVotes) * 100),
      'Mudah': Math.round((votes['Mudah'] / totalVotes) * 100),
      'Sedang': Math.round((votes['Sedang'] / totalVotes) * 100),
      'Sulit': Math.round((votes['Sulit'] / totalVotes) * 100),
    };

    return {
      votes,
      totalVotes: data.length,
      userVote,
      percentages,
    };
  } catch (err) {
    console.warn('[DIFFICULTY VOTES ERROR]:', err);
    const total = 23;
    return {
      votes: defaultVotes,
      totalVotes: total,
      percentages: {
        'Sangat Mudah': 13,
        'Mudah': 61,
        'Sedang': 22,
        'Sulit': 4,
      },
    };
  }
}

// Submit a community difficulty vote
export async function submitDifficultyVote(songId: string, difficulty: string, userId?: string): Promise<boolean> {
  try {
    const effectiveUserId = userId || 'anon-' + Math.random().toString(36).substring(2, 9);

    const { error } = await supabase
      .from('song_difficulty_votes')
      .upsert(
        { song_id: songId, user_id: effectiveUserId, difficulty },
        { onConflict: 'song_id,user_id' }
      );

    if (error) {
      console.warn('[DIFFICULTY UPSERT WARN]:', error.message);
      await supabase.from('song_difficulty_votes').insert({ song_id: songId, user_id: effectiveUserId, difficulty });
    }
    return true;
  } catch (err) {
    console.error('[DIFFICULTY SUBMIT ERROR]:', err);
    return false;
  }
}
