import React from 'react';
import { supabase } from '@/lib/supabase';
import SongCard from '@/components/SongCard';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q;

  let results: any[] = [];
  let errorMsg: string | null = null;

  if (query) {
    const { data, error } = await supabase
      .from('chords')
      .select('id, title, artist, cover_url, source_url')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      errorMsg = "Gagal mengambil data pencarian dari database.";
    } else if (data) {
      results = data;
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in pt-24 px-4 md:px-8 lg:px-12">
      <div className="border-b border-white/[0.06] pb-6 mb-4">
        <h1 className="text-2xl font-black text-white mb-2">
          Hasil Pencarian
        </h1>
        <p className="text-slate-500 text-sm">
          {query ? (
            <>Menampilkan hasil untuk: <span className="text-primary font-bold">&quot;{query}&quot;</span> — {results.length} ditemukan</>
          ) : (
            "Ketikkan judul lagu atau nama artis di kolom pencarian."
          )}
        </p>
      </div>

      {errorMsg ? (
        <div className="text-red-400 p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-sm">
          {errorMsg}
        </div>
      ) : query && results.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-white/[0.06] rounded-xl bg-surface">
          <p className="text-lg">Tidak ada chord yang cocok dengan pencarian ini.</p>
          <p className="mt-4 text-sm max-w-md mx-auto text-slate-600">
            Hubungi Admin agar admin bisa menambahkan lagu ini ke dalam koleksi melalui halaman <a href="/admin" className="text-primary hover:underline font-medium">Admin Scraper</a>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {results.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
