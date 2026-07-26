"use client";

import React, { useState, useEffect } from "react";
import { Link2, Disc3, Save, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, normalizeSong } from "@/lib/supabase";
import Link from "next/link";

export default function AdminPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  const [chords, setChords] = useState<any[]>([]);
  const [fetchingChords, setFetchingChords] = useState(true);

  const router = useRouter();

  const loadChords = async () => {
    setFetchingChords(true);
    try {
      // 1. Try fetching 'songs'
      const { data: songsData, error: songsErr } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!songsErr && songsData && songsData.length > 0) {
        setChords(songsData.map(normalizeSong));
      } else {
        // 2. Try fetching 'chords'
        const { data: chordsData, error: chordsErr } = await supabase
          .from('chords')
          .select('*')
          .order('created_at', { ascending: false });

        if (!chordsErr && chordsData && chordsData.length > 0) {
          setChords(chordsData.map(normalizeSong));
        } else {
          const { INITIAL_FALLBACK_CHORDS } = await import("@/lib/fallbackData");
          setChords(INITIAL_FALLBACK_CHORDS);
        }
      }
    } catch {
      const { INITIAL_FALLBACK_CHORDS } = await import("@/lib/fallbackData");
      setChords(INITIAL_FALLBACK_CHORDS);
    }
    setFetchingChords(false);
  };

  useEffect(() => {
    loadChords();
  }, []);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal melakukan scraping.");
      }

      setMessage({ text: `Berhasil menambahkan: ${data.title} — ${data.artist}`, type: "success" });
      setUrl("");
      loadChords();
      router.refresh(); 
      
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmAsk = window.confirm(`Hapus "${title}" dari database secara permanen?`);
    if (!confirmAsk) return;

    // Try deleting from both 'songs' and 'chords'
    await supabase.from('songs').delete().eq('id', id);
    await supabase.from('chords').delete().eq('id', id);

    setChords(prev => prev.filter(c => c.id !== id));
    setMessage({ text: `"${title}" berhasil dihapus.`, type: "success" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-12 pt-24 px-4 animate-fade-in pb-32 min-h-screen bg-black">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <Disc3 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Pusat Komando Admin</h1>
        <p className="text-slate-400 text-sm mt-1">
          Masukkan URL Chordtela untuk menyedot data chord & lirik langsung ke database Supabase.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Scraper Form */}
      <form onSubmit={handleScrape} className="flex flex-col gap-4 bg-surface-light/60 p-6 md:p-8 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          URL Target Chordtela
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Link2 className="h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.chordtela.com/..."
            className="w-full bg-black/80 border border-white/10 rounded-lg py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all font-mono text-sm"
            required
            pattern="https?://.*chordtela\.com/.*"
            title="Harus berupa link dari chordtela.com"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-primary-light hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm mt-1"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> Sedot & Simpan Ke Database</>
          )}
        </button>
      </form>

      {/* Table */}
      <div className="bg-surface-light/60 rounded-xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
               Koleksi Database Songs <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-md border border-primary/30 ml-2 font-mono font-bold">{chords.length}</span>
            </h2>
        </div>
        
        <div className="overflow-x-auto">
          {fetchingChords ? (
             <div className="p-12 text-center text-slate-500 animate-pulse text-sm">Memuat data dari database...</div>
          ) : chords.length === 0 ? (
             <div className="p-12 text-center text-slate-500 text-sm">Database kosong. Tambah data di atas.</div>
          ) : (
             <table className="w-full text-left text-sm">
               <thead className="bg-black/60 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 border-b border-white/10">
                 <tr>
                   <th className="px-5 py-3.5">Lagu & Artis</th>
                   <th className="px-5 py-3.5">Tanggal</th>
                   <th className="px-5 py-3.5 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/10">
                 {chords.map((entry) => (
                   <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors group">
                     <td className="px-5 py-4">
                       <div className="font-semibold text-white text-sm group-hover:text-primary transition-colors">{entry.title}</div>
                       <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                           {entry.artist}
                           <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                               {entry.views || entry.view_count || 0} views
                           </span>
                       </div>
                     </td>
                     <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-xs font-mono">
                       {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                     </td>
                     <td className="px-5 py-4 flex items-center justify-center gap-2">
                       <Link href={`/chord/${entry.id}`} target="_blank" className="p-2 bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Buka Detail">
                         <ExternalLink className="w-3.5 h-3.5" />
                       </Link>
                       <button 
                         onClick={() => handleDelete(entry.id, entry.title)} 
                         className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" 
                         title="Hapus"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          )}
        </div>
      </div>
    </div>
  );
}
