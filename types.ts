
/**
 * User profile information fetched from the database.
 */
export interface Profile {
  /** Unique identifier for the user. */
  id: string;
  /** Full name of the user. */
  full_name: string | null;
  /** URL to the user's avatar image. */
  avatar_url: string | null;
  /** Role of the user for permission management. */
  role: 'user' | 'admin' | 'super_admin';
}

/**
 * Represents a song with its metadata and musical content.
 */
export interface Song {
  /** Unique identifier for the song. */
  id: string;
  /** Title of the song. */
  title: string;
  /** Artist who performed the song. */
  artist: string;
  /**
   * Chords can be the structured ChordLine[] (Legacy/AI) or simple string[] (Seeded/Manual).
   * Represents the sequence of chords in the song.
   */
  chords: ChordLine[] | string[] | null;
  /**
   * Tablature data, potentially containing ChordPro content string.
   */
  tablature: TablatureData | null;
  /** Difficulty level of the song. */
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  /** Spotify track ID for integration. */
  spotify_track_id: string | null;
  /** YouTube video ID for integration. */
  youtube_video_id: string | null;
  /** Number of times the song has been viewed. */
  view_count: number;
  /** ID of the album the song belongs to. */
  album_id?: string;
  /** Path to the user-uploaded file, if applicable. */
  file_path?: string | null; // For user uploaded files
}

/**
 * Represents a music album.
 */
export interface Album {
  /** Unique identifier for the album. */
  id: string;
  /** Title of the album. */
  title: string;
  /** Artist of the album. */
  artist: string;
  /** URL to the album cover image. */
  cover_url: string;
  /** Release date of the album. */
  release_date?: string;
}

/**
 * Represents a single line of lyrics with associated chords (Legacy structure).
 */
export interface ChordLine {
  /** The lyric text for the line. */
  line: string; 
  /** Array of chords associated with this line. */
  chords: string[]; 
}

/**
 * Flexible type for tablature data.
 * Can contain arbitrary keys, but typically includes `content` for ChordPro strings.
 */
// Allows flexibility for { content: "[C]ChordPro..." }
export type TablatureData = Record<string, unknown> & { content?: string };

/**
 * Represents a user's rating for a song.
 */
export interface SongRating {
  /** The ID of the song being rated. */
  song_id: string;
  /** The ID of the user giving the rating. */
  user_id: string;
  /** The rating value (e.g., 1-5). */
  rating: number;
}

/**
 * Represents a user's favorite song.
 */
export interface SongFavorite {
  /** The ID of the user. */
  user_id: string;
  /** The ID of the song marked as favorite. */
  song_id: string;
}

/**
 * Data required to generate chords using AI.
 */
export interface AIChordFormData {
  /** Title of the song. */
  title: string;
  /** Artist of the song. */
  artist: string;
  /** Lyrics of the song to analyze. */
  lyrics: string;
}

/**
 * Represents a video tutorial for a song.
 */
export interface VideoTutorial {
  /** The YouTube video ID. */
  video_id: string;
  /** Title of the video. */
  title: string;
  /** URL of the video thumbnail. */
  thumbnail_url: string;
  /** Name of the YouTube channel. */
  channel_title: string;
}

/**
 * Represents a result from a search operation.
 */
export interface SearchResult {
  /** Unique identifier for the result item. */
  id: string;
  /** Title of the result item. */
  title: string;
  /** Artist name (if applicable). */
  artist?: string;
  /** Thumbnail image URL (if applicable). */
  thumbnail?: string;
  /** Source of the result (YouTube, Spotify, or local library). */
  source: 'youtube' | 'spotify' | 'library';
  /** External URL for the result (if applicable). */
  url?: string;
}
