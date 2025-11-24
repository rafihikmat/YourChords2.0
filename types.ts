
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'super_admin';
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  // Chords can be the structured ChordLine[] (Legacy/AI) or simple string[] (Seeded/Manual)
  chords: ChordLine[] | string[] | null;
  // Tablature can now contain { content: string } for ChordPro data
  tablature: TablatureData | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  spotify_track_id: string | null;
  youtube_video_id: string | null;
  view_count: number;
  album_id?: string;
  file_path?: string | null; // For user uploaded files
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  release_date?: string;
}

export interface ChordLine {
  line: string; 
  chords: string[]; 
}

// Allows flexibility for { content: "[C]ChordPro..." }
export type TablatureData = Record<string, unknown> & { content?: string };

export interface SongRating {
  song_id: string;
  user_id: string;
  rating: number;
}

export interface SongFavorite {
  user_id: string;
  song_id: string;
}

export interface AIChordFormData {
  title: string;
  artist: string;
  lyrics: string;
}

export interface VideoTutorial {
  video_id: string;
  title: string;
  thumbnail_url: string;
  channel_title: string;
}

export interface SearchResult {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  source: 'youtube' | 'spotify' | 'library';
  url?: string;
}
