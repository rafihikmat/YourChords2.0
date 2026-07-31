"use client";

import React, { useState } from "react";
import { X, Edit3, Send, AlertCircle, CheckCircle2, FileText, MessageSquare, Lock } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import { submitSongCorrection } from "@/lib/corrections";

interface ChordCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  songTitle: string;
  songArtist: string;
  currentContent: string;
}

export default function ChordCorrectionModal({
  isOpen,
  onClose,
  songId,
  songTitle,
  songArtist,
  currentContent,
}: ChordCorrectionModalProps) {
  const { user } = useAuth();

  const [proposedContent, setProposedContent] = useState<string>(currentContent);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth modal state if guest clicks
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Guard: Require user authentication
    if (!user) {
      setError("Silakan Sign In / Login terlebih dahulu untuk mengirim usulan perbaikan.");
      setShowAuthModal(true);
      return;
    }

    if (!reason.trim()) {
      setError("Harap berikan alasan perbaikan (contoh: Kunci Refrain salah, typo pada bait 2).");
      return;
    }

    if (!proposedContent.trim()) {
      setError("Isi chord dan lirik usulan tidak boleh kosong.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitSongCorrection({
        songId,
        userId: user.id,
        reason: reason.trim(),
        proposedContent: proposedContent.trim(),
        originalContent: currentContent,
      });

      if (!res.success) {
        setError(res.error || res.message || "Gagal menyimpan usulan perbaikan ke database.");
      } else {
        setSuccessMsg(res.message || "✨ Usulan perbaikan berhasil dikirim ke Admin!");
        setReason("");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan sistem saat mengirim usulan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
        <div className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
          
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-surface/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/20 border border-primary/40 rounded-xl text-primary">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wide">
                  Saran Perbaikan Chord & Lirik
                </h3>
                <p className="text-xs text-slate-400">
                  Lagu: <span className="text-white font-bold">{songTitle}</span> — {songArtist}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL BODY */}
          <form onSubmit={handleSubmit} className="p-5 md:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
            {/* SUCCESS BANNER TOAST */}
            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ERROR BANNER */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* GUEST BANNER */}
            {!user && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Anda harus Sign In terlebih dahulu untuk dapat mengirim usulan perbaikan.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 bg-amber-500 text-black font-extrabold rounded-lg text-xs hover:bg-amber-400 transition-colors cursor-pointer flex-shrink-0"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* REASON INPUT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Alasan / Deskripsi Perbaikan <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Chord Reff seharusnya 'Am' bukan 'A', ada kata typo pada chorus"
                className="bg-black/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 font-mono"
                required
              />
            </div>

            {/* EDITABLE CHORD SHEET TEXTAREA */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Edit Lirik & Chord Usulan Baru:</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Monospace editor</span>
              </div>

              <textarea
                value={proposedContent}
                onChange={(e) => setProposedContent(e.target.value)}
                rows={12}
                className="w-full bg-black/90 border border-white/10 rounded-xl p-4 text-xs font-mono text-emerald-400 leading-relaxed focus:outline-none focus:border-primary/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all whitespace-pre overflow-x-auto"
                required
              />
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting || !!successMsg}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-40 cursor-pointer"
              >
                {submitting ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Usulan</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
}
