"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Edit3, CheckCircle2, XCircle, RefreshCw, FileText, User, MessageSquare, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { 
  getPendingCorrections, approveCorrection, rejectCorrection, SongCorrection 
} from "@/lib/corrections";
import CyberButton from "@/components/ui/CyberButton";
import CyberBadge from "@/components/ui/CyberBadge";
import CyberCard from "@/components/ui/CyberCard";

export default function CorrectionsPanel({ onApproved }: { onApproved?: () => void }) {
  const [corrections, setCorrections] = useState<SongCorrection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadCorrections = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await getPendingCorrections();
      setCorrections(pending);
    } catch (err) {
      console.error("[LOAD CORRECTIONS ERROR]:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  const handleApprove = async (correction: SongCorrection) => {
    const confirmApprove = window.confirm(
      `Terapkan usulan perbaikan ini ke lagu "${correction.song_title}"? Lirik/chord lama akan diperbarui secara permanen.`
    );
    if (!confirmApprove) return;

    setProcessingId(correction.id);
    setMessage(null);

    const res = await approveCorrection(correction.id, correction.song_id, correction.proposed_content);

    if (res.success) {
      setMessage({ text: res.message, type: "success" });
      loadCorrections();
      if (onApproved) onApproved();
    } else {
      setMessage({ text: res.message, type: "error" });
    }

    setProcessingId(null);
  };

  const handleReject = async (correction: SongCorrection) => {
    const confirmReject = window.confirm(`Tolak usulan perbaikan untuk "${correction.song_title}"?`);
    if (!confirmReject) return;

    setProcessingId(correction.id);
    setMessage(null);

    const res = await rejectCorrection(correction.id);

    if (res.success) {
      setMessage({ text: res.message, type: "success" });
      loadCorrections();
    } else {
      setMessage({ text: res.message, type: "error" });
    }

    setProcessingId(null);
  };

  return (
    <CyberCard variant="glowing" padding="md">
      {/* PANEL HEADER */}
      <div className="border-b border-purple-500/15 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Moderasi Perbaikan Chord & Lirik (Usulan Komunitas)</span>
              <CyberBadge variant="purple" size="sm">
                {corrections.length} Antrean
              </CyberBadge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tinjau usulan pembetulan chord dari pengguna registered sebelum diterapkan ke lagu utama.
            </p>
          </div>
        </div>

        <CyberButton
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={loadCorrections}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-purple-400" />}
          className="self-start sm:self-auto"
        >
          Refresh
        </CyberButton>
      </div>

      {/* FEEDBACK TOAST */}
      {message && (
        <div className={`p-4 mb-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
          message.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* PANEL BODY */}
      <div>
        {loading ? (
          <div className="py-12 text-center text-slate-500 animate-pulse text-xs font-mono">
            Memuat daftar usulan perbaikan...
          </div>
        ) : corrections.length === 0 ? (
          <div className="py-12 text-center bg-slate-950/40 border border-dashed border-purple-500/20 rounded-xl p-6">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Semua Usulan Selesai Ditinjau</h3>
            <p className="text-[11px] text-slate-400">Tidak ada antrean saran perbaikan chord saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {corrections.map((item) => {
              const isExpanded = expandedId === item.id;
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-purple-500/20 hover:border-purple-500/40 rounded-xl p-4 transition-all duration-200"
                >
                  {/* HEADER ITEM */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-500/15 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{item.song_title}</span>
                        <span className="text-xs text-slate-400">— {item.song_artist}</span>
                        <Link
                          href={`/chord/${item.song_id}`}
                          target="_blank"
                          className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                          title="Lihat Lagu Asli"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3 h-3 text-cyan-400" /> {item.user_name}
                          {item.user_email ? ` (${item.user_email})` : ""}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">
                          {new Date(item.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <CyberButton
                        variant="cyan"
                        size="sm"
                        isLoading={isProcessing}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleApprove(item)}
                      >
                        Setujui
                      </CyberButton>

                      <CyberButton
                        variant="danger"
                        size="sm"
                        isLoading={isProcessing}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleReject(item)}
                      >
                        Tolak
                      </CyberButton>
                    </div>
                  </div>

                  {/* REASON BOX */}
                  <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-3 text-xs mb-3">
                    <span className="font-bold text-purple-300 flex items-center gap-1 mb-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Alasan Perbaikan Pengguna:
                    </span>
                    <p className="text-slate-200 font-medium">{item.reason}</p>
                  </div>

                  {/* PROPOSED CONTENT TOGGLE / DISPLAY */}
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isExpanded ? "Sembunyikan Perbandingan Usulan" : "Pratinjau Perbandingan Chord Usulan (Versi Asli vs Baru) (+)"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-bold font-mono text-slate-400 uppercase mb-1">Original Content (Lirik/Chord Lama):</div>
                          <div className="bg-slate-950 border border-rose-500/20 rounded-lg p-3 font-mono text-xs text-rose-300/80 whitespace-pre leading-relaxed max-h-64 overflow-y-auto">
                            {item.original_content || "(Lirik asli tidak tersimpan)"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold font-mono text-cyan-400 uppercase mb-1">Proposed Content (Usulan Baru):</div>
                          <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3 font-mono text-xs text-emerald-300 whitespace-pre leading-relaxed max-h-64 overflow-y-auto">
                            {item.proposed_content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </CyberCard>
  );
}
