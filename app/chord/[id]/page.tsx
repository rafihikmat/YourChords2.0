import React from "react";
import { supabase } from "@/lib/supabase";
import { Metadata, ResolvingMetadata } from "next";
import ChordClientDetail from "@/components/ChordClientDetail";

type Props = {
  params: { id: string };
};

// --- Dynamic SEO (Meta Tags) ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;

  const { data } = await supabase
    .from('chords')
    .select('title, artist, content, cover_url')
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: "Lagu Tidak Ditemukan | YourChords",
    };
  }

  // Ambil 100 karakter pertama lirik untuk deskripsi snippet Google
  const cleanText = data.content.replace(/[^a-zA-Z0-9\s]/g, '');
  const snippet = cleanText.substring(0, 120).trim() + "...";

  return {
    title: `Chord ${data.title} - ${data.artist} | YourChords`,
    description: `Mainkan chord gitar dasar dan lirik lagu ${data.title} oleh ${data.artist}. ${snippet}`,
    openGraph: {
      title: `Chord ${data.title} - ${data.artist}`,
      description: `Lirik dan Chord gitar termudah ${data.title} - ${data.artist}`,
      images: data.cover_url ? [data.cover_url] : [],
    },
  };
}

// --- Data Fetching murni dari Supabase DB (SSR) ---
export default async function ChordDetailPage({ params }: Props) {
  const songId = params.id;

  const { data: dbData, error } = await supabase
    .from('chords')
    .select('id, title, artist, cover_url, content, views')
    .eq('id', songId)
    .single();

  if (error || !dbData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Terjadi Kesalahan / 404</h2>
        <p className="text-slate-300 max-w-md">Data chord tidak dapat ditarik dari database server.</p>
      </div>
    );
  }

  // --- Logic increment views (Tracking Trending) ---
  // Kita update secara asinkron tanpa harus diblok (fire and forget) untuk kecepatan response SSR
  if (dbData) {
    supabase
      .from('chords')
      .update({ views: (dbData.views || 0) + 1 })
      .eq('id', songId)
      .then(); // fire and forget
  }

  return (
    <ChordClientDetail data={dbData} />
  );
}
