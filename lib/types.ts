/**
 * Core type definitions for YourChords 2.0
 * Salvaged and trimmed from legacy types.ts
 */

/** Database row shape for the 'chords' table */
export interface ChordEntry {
  id: string;
  title: string;
  artist: string;
  content: string;
  source_url: string;
  cover_url: string | null;
  views: number;
  created_at: string;
}

/** User profile from 'profiles' table */
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'super_admin';
}
