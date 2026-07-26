import React, { Suspense } from "react";
import SongCard from "@/components/SongCard";
import { supabase } from "@/lib/supabase";
import { AnimatedSection, HeroCarousel } from "@/components/HomeClientComponents";

// --- Server Component Khusus Data DB ---
async function DynamicHomeContent() {
  const { data: songs, error } = await supabase
    .from('chords')
    .select('id, title, artist, cover_url, source_url, views, created_at')
    .order('views', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !songs || songs.length === 0) {
    return (
      <div className="text-center py-20 text-slate-600 border border-white/[0.06] rounded-xl bg-surface m-4 mt-24">
        <p>Belum ada chord terbaru yang tersimpan di database.</p>
        <p className="text-sm mt-2">Masuk ke halaman <a href="/admin" className="text-primary hover:underline">Admin</a> untuk menambah data.</p>
      </div>
    );
  }

  // Ambil top 3 songs untuk Banner
  const top3TendingSongs = songs.slice(0, 3);
  // Sisanya masuk ke "Baru Ditambahkan" (Atau ambil ulang dari DB order by created_at)
  // Untuk efisiensi kita anggap sisanya dari fetch yang sama, atau lebih baik kita biarkan 
  // semua songs yang di-fetch ditampilkan. Di sini kita sort yg di bawah berdasar tanggal.
  const recentSongs = [...songs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

  return (
    <div className="flex flex-col gap-12 pb-16 pt-0">
      
      {/* MASSIVE HERO BANNER CAROUSEL */}
      <HeroCarousel trendingSongs={top3TendingSongs} />

      {/* HORIZONTAL ROWS - TERBARU */}
      <div className="px-4 md:px-8 lg:px-12 -mt-10 relative z-10">
        <AnimatedSection title="Baru Ditambahkan" subtitle="Lihat Semua">
          <div className="flex w-full gap-4 md:gap-5 overflow-x-auto snap-x hide-scrollbar pb-6 pt-2">
            {recentSongs.map((song) => (
              <div className="snap-start" key={song.id}>
                <SongCard song={song} />
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>

    </div>
  );
}

// Fallback skeleton loader
function NetflixSkeleton() {
  return (
    <div className="flex flex-col w-full h-screen animate-pulse">
      {/* Hero Skeleton */}
      <div className="w-full h-[75vh] bg-surface border-b border-white/[0.04] relative overflow-hidden">
         <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-[shimmer_2s_infinite]"></div>
      </div>
      
      {/* Row Skeleton */}
      <div className="px-4 md:px-8 -mt-20 z-10 flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-56 aspect-[3/4] bg-surface rounded-lg relative overflow-hidden border border-white/[0.04]">
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-[shimmer_2s_infinite]"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<NetflixSkeleton />}>
        <DynamicHomeContent />
      </Suspense>
    </main>
  );
}
