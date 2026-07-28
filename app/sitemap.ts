import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yourchords.com';

  // Fetch all songs from 'songs' and 'chords' table
  let songsList: { id: string; created_at?: string }[] = [];

  try {
    const { data: songs } = await supabase
      .from('songs')
      .select('id, created_at');

    if (songs && songs.length > 0) {
      songsList = songs;
    } else {
      const { data: chords } = await supabase
        .from('chords')
        .select('id, created_at');
      if (chords) {
        songsList = chords;
      }
    }
  } catch (error) {
    console.warn('[SITEMAP GENERATOR ERROR]:', error);
  }

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/request`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/setlists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamic song routes for both /chord/[id] and /song/[id]
  const chordSongRoutes: MetadataRoute.Sitemap = songsList.flatMap((song) => {
    const lastMod = song.created_at ? new Date(song.created_at) : new Date();
    return [
      {
        url: `${baseUrl}/chord/${song.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/song/${song.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
    ];
  });

  return [...staticRoutes, ...chordSongRoutes];
}
