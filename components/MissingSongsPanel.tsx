"use client";

import React, { useState } from "react";
import { 
  Sparkles, Wand2, Trash2, CheckCircle2, RefreshCw, Music2, AlertCircle
} from "lucide-react";
import { MissingSongItem } from "@/lib/adminAnalytics";

interface MissingSongsPanelProps {
  missingSongs: MissingSongItem[];
  loading: boolean;
  onQuickScrape: (query: string) => void;
  onRefresh: () => void;
}

export default function MissingSongsPanel({
  missingSongs,
  loading,
  onQuickScrape,
  onRefresh,
}: MissingSongsPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scrapingKey, setScrapingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handle1ClickScrape = async (item: MissingSongItem) => {
    const keyword = item.keyword || item.query || "";
    if (!keyword) return;

    const itemKey = item.id || keyword;
    setScrapingKey(itemKey);
    setToastMessage(null);

    // Call onQuickScrape to prefill or focus form if needed
    if (onQuickScrape) {
      onQuickScrape(keyword);
    }

    try {
      const targetUrl = keyword.toLowerCase().startsWith("http")
        ? keyword
        : `https://www.chordtela.com/search?q=${encodeURIComponent(keyword)}`;

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Delete keyword from missing_songs_log after successful scraping
        await fetch(`/api/request?id=${encodeURIComponent(item.id || '')}&keyword=${encodeURIComponent(keyword)}`, {
          method: 'DELETE',
        });

        setToastMessage({
          text: `✨ Lagu "${data.title || keyword}" berhasil disedot ke database & dihapus dari daftar permintaan!`,
          type: "success",
        });

        onRefresh();
      } else {
        setToastMessage({
          text: data.error || `Sistem membutuhkan pemilihan link spesifik untuk "${keyword}". URL telah diisi di form Batch Scraper di bawah!`,
          type: "error",
        });
      }
    } catch (err: any) {
      setToastMessage({
        text: err?.message || "Terjadi kesalahan saat menyedot lagu.",
        type: "error",
      });
    } finally {
      setScrapingKey(null);
    }
  };

  const handleResolveOrDelete = async (item: MissingSongItem) => {
    const keyword = item.keyword || item.query || "";
    const confirmAsk = window.confirm(`Tandai selesai dan hapus permintaan "${keyword}" dari daftar?`);
    if (!confirmAsk) return;

    const itemKey = item.id || keyword;
    setDeletingId(itemKey);

    try {
      const res = await fetch(`/api/request?id=${encodeURIComponent(item.id || '')}&keyword=${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToastMessage({ text: `Permintaan "${keyword}" berhasil dihapus.`, type: "success" });
        setTimeout(() => setToastMessage(null), 3000);
        onRefresh();
      } else {
        alert(data.error || "Gagal menghapus permintaan lagu.");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan saat menghapus permintaan.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-surface/80 rounded-2xl border border-amber-500/30 overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* PANEL HEADER */}
      <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              Smart Insight: Lagu Paling Dicari Pengguna (Missing Songs)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar kata kunci pencarian lagu yang belum ada di database. Klik &quot;Sedot Lagu Ini&quot; untuk langsung me-scrape!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-lg">
            {missingSongs.length} Kata Kunci
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in ${
          toastMessage.type === "success"
            ? "bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/15 border-b border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[10px] underline opacity-80 hover:opacity-100">
            Tutup
          </button>
        </div>
      )}

      {/* TABLE DATA */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-xs flex items-center justify-center gap-2 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Memuat data missing songs log...</span>
          </div>
        ) : missingSongs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Belum ada pencarian lagu yang hilang tercatat. Sistem akan mencatat otomatis ketika pengguna melakukan pencarian tanpa hasil!
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3">Kata Kunci / Judul Lagu</th>
                <th className="px-5 py-3 text-center">Permintaan User</th>
                <th className="px-5 py-3">Terakhir Dicari</th>
                <th className="px-5 py-3 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {missingSongs.map((item, idx) => {
                const keywordText = item.keyword || item.query || "Tanpa Kata Kunci";
                const itemKey = item.id || keywordText;
                const isScraping = scrapingKey === itemKey;
                const isDeleting = deletingId === itemKey;

                return (
                  <tr key={itemKey || idx} className="hover:bg-amber-500/5 transition-colors group">
                    <td className="px-5 py-3.5 font-bold text-white capitalize">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 w-5">#{idx + 1}</span>
                        <Music2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="group-hover:text-amber-400 transition-colors">{keywordText}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-500/40 rounded-md text-[11px] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        {item.search_count || item.count || 1}x dicari
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {item.last_searched_at ? new Date(item.last_searched_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Sedot Lagu Ini Button */}
                        <button
                          type="button"
                          onClick={() => handle1ClickScrape(item)}
                          disabled={isScraping || isDeleting}
                          className="px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-neon-sm text-[11px] disabled:opacity-50"
                        >
                          {isScraping ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyedot...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>Sedot Lagu Ini</span>
                            </>
                          )}
                        </button>

                        {/* Tandai Selesai / Hapus Button */}
                        <button
                          type="button"
                          onClick={() => handleResolveOrDelete(item)}
                          disabled={isScraping || isDeleting}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[11px] disabled:opacity-50"
                          title="Tandai Selesai / Hapus Permintaan"
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden md:inline">Selesai / Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
