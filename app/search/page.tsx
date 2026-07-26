import React from 'react';
import { searchSongs } from '@/lib/supabase';
import SongCard from '@/components/SongCard';

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }> | { q?: string };
}) {
  const resolvedSearchParams = await props.searchParams;
  const query = resolvedSearchParams?.q;

  const results = query ? await searchSongs(query) : [];

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in pt-24 px-4 md:px-8 lg:px-12 min-h-screen bg-black">
      <div className="border-b border-white/[0.08] pb-6 mb-2">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
          Hasil Pencarian
        </h1>
        <p className="text-slate-400 text-sm">
          {query ? (
            <>Menampilkan hasil untuk: <span className="text-primary font-bold neon-text">&quot;{query}&quot;</span> — {results.length} ditemukan</>
          ) : (
            "Ketikkan judul lagu atau nama artis di kolom pencarian di atas."
          )}
        </p>
      </div>

      {query && results.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border border-white/[0.08] rounded-xl bg-surface/50 backdrop-blur-md">
          <p className="text-lg font-semibold text-white">Tidak ada chord yang cocok dengan pencarian ini.</p>
          <p className="mt-3 text-sm max-w-md mx-auto text-slate-500">
            Hubungi Admin agar lagu ini dapat ditambahkan ke dalam koleksi melalui halaman <a href="/admin" className="text-primary hover:underline font-bold">Pusat Komando Admin</a>.
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
