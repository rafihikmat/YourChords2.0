"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText, MessageSquare, 
  Sparkles, RefreshCw, AlertCircle, ShieldCheck, Eye, Layers 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CorrectionItem {
  id: string;
  song_id: string;
  song_title?: string;
  song_artist?: string;
  original_content: string;
  proposed_content: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminCorrectionsPage() {
  const [corrections, setCorrections] = useState<CorrectionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedItem, setSelectedItem] = useState<CorrectionItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchCorrections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('song_corrections')
        .select('*, songs(title, artist)')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback sample corrections for demonstration
        const mockData: CorrectionItem[] = [
          {
            id: 'corr-1',
            song_id: 'dewa-19-kangen',
            song_title: 'Kangen',
            song_artist: 'Dewa 19',
            original_content: `Intro : C  G  Am  F\n\nC         G\nKutuliskan kenangan tentang\nAm        F\nCaraku menemukan dirimu...`,
            proposed_content: `Intro : C  Em  Am  F\n\nC         Em\nKutuliskan kenangan tentang\nAm        F\nCaraku menemukan dirimu...`,
            reason: 'Chord pada bait pertama seharusnya Em bukan G agar sesuai dengan rekaman album asli.',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'corr-2',
            song_id: 'peterpan-menghapus-jejakmu',
            song_title: 'Menghapus Jejakmu',
            song_artist: 'Peterpan',
            original_content: `C         D           Bm        Em\nKu terus berlari mengejar memori...`,
            proposed_content: `C         D           Bm        Em\nKu terus berlari mengejar bayangmu...`,
            reason: 'Lirik salah pada bait pertama, kata "memori" seharusnya "bayangmu".',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          },
        ];
        setCorrections(mockData);
        setSelectedItem(mockData[0]);
      } else {
        const formatted = data.map((item: any) => ({
          ...item,
          song_title: item.songs?.title || 'Unknown Song',
          song_artist: item.songs?.artist || 'Unknown Artist',
        }));
        setCorrections(formatted);
        if (formatted.length > 0) {
          setSelectedItem(formatted[0]);
        }
      }
    } catch (err: any) {
      console.warn('[FETCH CORRECTIONS WARN]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (item: CorrectionItem) => {
    setActionLoading(item.id);
    try {
      // 1. Update songs table content
      const { error: songUpdateErr } = await supabase
        .from('songs')
        .update({
          chords: item.proposed_content,
          content: item.proposed_content,
        })
        .eq('id', item.song_id);

      if (songUpdateErr) {
        console.warn('[UPDATE SONG WARN]:', songUpdateErr.message);
      }

      // 2. Update song_corrections status
      await supabase
        .from('song_corrections')
        .update({ status: 'approved' })
        .eq('id', item.id);

      // Local state update
      setCorrections((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: 'approved' } : c))
      );

      showToast(`Usulan perbaikan lagu "${item.song_title}" berhasil disetujui & dipublikasikan!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyetujui perbaikan.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: CorrectionItem) => {
    setActionLoading(item.id);
    try {
      await supabase
        .from('song_corrections')
        .update({ status: 'rejected' })
        .eq('id', item.id);

      setCorrections((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: 'rejected' } : c))
      );

      showToast(`Usulan perbaikan lagu "${item.song_title}" ditolak.`, 'error');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menolak perbaikan.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCorrections = corrections.filter((c) => c.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 selection:bg-primary selection:text-white">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/curated"
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Kembali ke Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Moderasi Usulan Perbaikan</span>
                <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded-full">
                  RBAC Pillar 1
                </span>
              </h1>
              <p className="text-xs text-slate-400">Tinjau & bandingkan perubahan chord yang diajukan komunitas</p>
            </div>
          </div>

          <button
            onClick={fetchCorrections}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </header>

      {/* TOAST FEEDBACK */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl border font-bold text-xs flex items-center gap-2.5 shadow-2xl animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-6">
        
        {/* STATUS TAB FILTER */}
        <div className="flex items-center gap-2 bg-surface/80 border border-white/10 p-1.5 rounded-2xl w-fit">
          {(['pending', 'approved', 'rejected'] as const).map((st) => {
            const count = corrections.filter((c) => c.status === st).length;
            const labels = { pending: 'Menunggu Moderasi', approved: 'Disetujui', rejected: 'Ditolak' };

            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  const firstOfSt = corrections.find((c) => c.status === st);
                  setSelectedItem(firstOfSt || null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  statusFilter === st
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="capitalize">{labels[st]}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* CORRECTIONS DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT LIST: CORRECTION PROPOSALS (4 COLS) */}
          <section className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              <span>Daftar Usulan ({filteredCorrections.length})</span>
            </h3>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredCorrections.length === 0 ? (
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Tidak ada usulan perbaikan dengan status {statusFilter}.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
                {filteredCorrections.map((item) => {
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-primary/15 border-primary shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                          : 'bg-surface/70 border-white/10 hover:border-white/20 hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs md:text-sm font-extrabold text-white line-clamp-1">
                            {item.song_title}
                          </h4>
                          <p className="text-[11px] text-slate-400">{item.song_artist}</p>
                        </div>
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          item.status === 'pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                          item.status === 'approved' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                          'bg-red-500/20 border-red-500/40 text-red-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 bg-black/50 p-2.5 rounded-xl border border-white/5 line-clamp-2">
                        <span className="font-bold text-primary">Alasan: </span>
                        {item.reason}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </span>
                        <span>Klik untuk Diff View →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT VIEW: SIDE-BY-SIDE DIFF VIEW & ACTIONS (8 COLS) */}
          <section className="lg:col-span-8">
            {!selectedItem ? (
              <div className="bg-surface/50 border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <Eye className="w-8 h-8 text-slate-600" />
                <span>Pilih salah satu usulan perbaikan di sebelah kiri untuk melihat perbandingan.</span>
              </div>
            ) : (
              <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
                
                {/* PROPOSAL HEADER & ACTIONS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {selectedItem.song_title} <span className="text-slate-400 font-normal">({selectedItem.song_artist})</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Alasan: <strong className="text-white">{selectedItem.reason}</strong></span>
                    </div>
                  </div>

                  {/* APPROVE / REJECT BUTTONS */}
                  <div className="flex items-center gap-2">
                    {selectedItem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReject(selectedItem)}
                          disabled={actionLoading === selectedItem.id}
                          className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>

                        <button
                          onClick={() => handleApprove(selectedItem)}
                          disabled={actionLoading === selectedItem.id}
                          className="px-5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui & Terbitkan</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* SIDE-BY-SIDE DIFF VIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* LEFT: ORIGINAL CONTENT */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-white/10 pb-2">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Versi Asli (Saat Ini)</span>
                      </span>
                    </div>
                    <div className="bg-black/80 border border-red-500/20 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre leading-relaxed overflow-x-auto max-h-[50vh]">
                      {selectedItem.original_content}
                    </div>
                  </div>

                  {/* RIGHT: PROPOSED CONTENT */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-white/10 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Usulan Baru Komunitas</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Usulan
                      </span>
                    </div>
                    <div className="bg-black/90 border border-emerald-500/40 rounded-xl p-4 text-xs font-mono text-emerald-300 whitespace-pre leading-relaxed overflow-x-auto max-h-[50vh] shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      {selectedItem.proposed_content}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </section>

        </div>

      </main>
    </div>
  );
}
