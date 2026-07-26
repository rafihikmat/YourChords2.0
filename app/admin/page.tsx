"use client";

import React, { useState, useEffect } from "react";
import { Link2, Disc3, Save, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
    const { data, error } = await supabase
      .from('chords')
      .select('id, title, artist, source_url, created_at, views')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChords(data);
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

    const { error } = await supabase.from('chords').delete().eq('id', id);
    if (error) {
      alert("Gagal menghapus. Error: " + error.message);
    } else {
      setChords(prev => prev.filter(c => c.id !== id));
      setMessage({ text: `"${title}" berhasil dihapus.`, type: "success" });
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-12 pt-24 px-4 animate-fade-in pb-32">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-neon-sm">
          <Disc3 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Pusat Komando</h1>
        <p className="text-slate-500 text-sm mt-1">
          Masukkan URL Chordtela untuk menyedot data ke database.
        </p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-lg border text-sm ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Scraper Form */}
      <form onSubmit={handleScrape} className="flex flex-col gap-4 bg-surface p-6 rounded-xl border border-white/[0.06]">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          URL Target
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Link2 className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.chordtela.com/..."
            className="w-full bg-black border border-white/[0.08] rounded-lg py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)] transition-all font-mono text-sm"
            required
            pattern="https?://.*chordtela\.com/.*"
            title="Harus berupa link dari chordtela.com"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-primary-light hover:shadow-neon transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> Sedot & Simpan</>
          )}
        </button>
      </form>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
               Koleksi Database <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 ml-2 font-mono">{chords.length}</span>
            </h2>
        </div>
        
        <div className="overflow-x-auto">
          {fetchingChords ? (
             <div className="p-12 text-center text-slate-600 animate-pulse text-sm">Memuat data...</div>
          ) : chords.length === 0 ? (
             <div className="p-12 text-center text-slate-600 text-sm">Database kosong. Tambah data di atas.</div>
          ) : (
             <table className="w-full text-left text-sm">
               <thead className="bg-black/50 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 border-b border-white/[0.04]">
                 <tr>
                   <th className="px-5 py-3">Lagu & Artis</th>
                   <th className="px-5 py-3">Tanggal</th>
                   <th className="px-5 py-3 text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.04]">
                 {chords.map((entry) => (
                   <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-5 py-4">
                       <div className="font-semibold text-white text-sm group-hover:text-primary transition-colors">{entry.title}</div>
                       <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
                           {entry.artist}
                           <span className="text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-slate-600 font-mono">
                               {entry.views || 0} views
                           </span>
                       </div>
                     </td>
                     <td className="px-5 py-4 whitespace-nowrap text-slate-600 text-xs font-mono">
                       {new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}
                     </td>
                     <td className="px-5 py-4 flex items-center justify-center gap-2">
                       <Link href={`/chord/${entry.id}`} target="_blank" className="p-2 bg-white/[0.04] hover:bg-primary/10 text-slate-500 hover:text-primary rounded-lg transition-colors" title="Buka">
                         <ExternalLink className="w-3.5 h-3.5" />
                       </Link>
                       <button 
                         onClick={() => handleDelete(entry.id, entry.title)} 
                         className="p-2 bg-red-500/[0.06] hover:bg-red-500/15 text-red-500/70 hover:text-red-400 rounded-lg transition-colors" 
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
