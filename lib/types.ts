/**
 * Core type definitions for YourChords 2.0
 */

/** Database row shape for 'songs' / 'chords' table */
export interface Song {
  id: string;
  title: string;
  artist: string;
  chords?: any;
  content?: string;
  source_url?: string | null;
  cover_url?: string | null;
  view_count?: number;
  views?: number;
  created_at?: string;
  spotify_track_id?: string | null;
  youtube_video_id?: string | null;
  difficulty?: string | null;
  key_chord?: string | null;
  key?: string | null;
}

export type ChordEntry = Song;

/** User profile from 'profiles' table */
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "super_admin";
}

/** Setlist / Songbook interface */
export interface Setlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
  song_ids: string[];
  songs?: Song[];
}
