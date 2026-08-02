import React from "react";
import { getSongById, getRelatedSongs, incrementSongView } from "@/lib/supabase";
import { getSongRatingStats, getSongDifficultyStats } from "@/lib/ratings";
import { Metadata, ResolvingMetadata } from "next";
import ChordClientDetail from "@/components/ChordClientDetail";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR Route Caching 60 Seconds

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

// Dynamic SEO & Metadata Generation
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

  const cleanText = (songData.content || "").replace(/[^a-zA-Z0-9\s]/g, "");
  const snippet = cleanText.substring(0, 120).trim() + "...";
  const ogImageUrl = `/api/og?title=${encodeURIComponent(songData.title)}&artist=${encodeURIComponent(songData.artist)}&cover=${encodeURIComponent(songData.cover_url || "")}`;

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
      card: "summary_large_image",
      title: `Chord ${songData.title} - ${songData.artist}`,
      description: `Lirik dan Chord gitar termudah ${songData.title} - ${songData.artist}`,
      images: [ogImageUrl],
    },
  };
}

// Server Page Component with True 1-Pass Parallel Fetching
export default async function SongDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const songId = resolvedParams.id;

  // True 1-Pass Parallel Data Fetching
  const [songData, ratingStats, difficultyStats, relatedSongs] = await Promise.all([
    getSongById(songId),
    getSongRatingStats(songId),
    getSongDifficultyStats(songId),
    getRelatedSongs(songId),
  ]);

  if (!songData) {
    notFound();
  }

  // Increment view count asynchronously
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
