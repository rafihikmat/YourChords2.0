import React from "react";
import { fetchSongById, incrementSongView } from "@/lib/supabase";
import { Metadata, ResolvingMetadata } from "next";
import ChordClientDetail from "@/components/ChordClientDetail";

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

  const songData = await fetchSongById(id);

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

// --- Data Fetching murni dari Supabase DB (SSR) ---
export default async function ChordDetailPage(props: Props) {
  const resolvedParams = await props.params;
  const songId = resolvedParams.id;

  const songData = await fetchSongById(songId);

  if (!songData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Terjadi Kesalahan / 404</h2>
        <p className="text-slate-300 max-w-md">Data chord tidak dapat ditarik dari database server.</p>
      </div>
    );
  }

  // Increment view count in fire-and-forget style
  incrementSongView(songId, songData.views || 0);

  return (
    <ChordClientDetail data={songData as any} />
  );
}
