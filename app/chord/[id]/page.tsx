import React from "react";
import { getSongById, getRelatedSongs, incrementSongView } from "@/lib/supabase";
import { getSongRatingStats, getSongDifficultyStats } from "@/lib/ratings";
import { Metadata, ResolvingMetadata } from "next";
import ChordClientDetail from "@/components/ChordClientDetail";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

// --- Dynamic SEO (Meta Tags) ---
export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await props.params;
  const id = resolvedParams.id;

  const songData = await getSongById(id);

  if (!songData) {
    return {
      title: "Lagu Tidak Ditemukan | YourChords",
    };
  }

  // Ambil 120 karakter pertama lirik/chord untuk deskripsi snippet
  const cleanText = (songData.content || "").replace(/[^a-zA-Z0-9\s]/g, '');
  const snippet = cleanText.substring(0, 120).trim() + "...";

  const ogImageUrl = `/api/og?title=${encodeURIComponent(songData.title)}&artist=${encodeURIComponent(songData.artist)}&cover=${encodeURIComponent(songData.cover_url || '')}`;

  return {
    title: `Chord ${songData.title} - ${songData.artist} | YourChords`,
    description: `Mainkan chord gitar dasar dan lirik lagu ${songData.title} oleh ${songData.artist}. ${snippet}`,
    openGraph: {
      title: `Chord ${songData.title} - ${songData.artist}`,
      description: `Lirik dan Chord gitar termudah ${songData.title} - ${songData.artist}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Chord ${songData.title} - ${songData.artist}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Chord ${songData.title} - ${songData.artist}`,
      description: `Lirik dan Chord gitar termudah ${songData.title} - ${songData.artist}`,
      images: [ogImageUrl],
    },
  };
}

// --- Data Fetching dengan PARALLEL FETCHING (Promise.all) ---
export default async function SongDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const songId = resolvedParams.id;

  // 1. Ambil data utama lagu
  const songData = await getSongById(songId);

  if (!songData) {
    notFound();
  }

  // 2. Ambil data pendukung (rating stats, difficulty stats, related songs) secara PARALEL sekaligus!
  const [ratingStats, difficultyStats, relatedSongs] = await Promise.all([
    getSongRatingStats(songId),
    getSongDifficultyStats(songId),
    getRelatedSongs(songData.artist, songId)
  ]);

  // Fire and forget view increment
  incrementSongView(songId, songData.views || 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <ChordClientDetail 
        song={songData as any}
        data={songData as any}
        ratingStats={ratingStats}
        difficultyStats={difficultyStats}
        relatedSongs={relatedSongs}
      />
    </main>
  );
}
