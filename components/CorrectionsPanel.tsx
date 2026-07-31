"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2,
    Edit3,
    ExternalLink,
    FileText,
    MessageSquare,
    RefreshCw,
    Sparkles,
    User,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import {
    approveCorrection,
    getPendingCorrections,
    rejectCorrection,
    SongCorrection,
} from "@/lib/corrections";

export default function CorrectionsPanel(
    { onApproved }: { onApproved?: () => void },
) {
    const [corrections, setCorrections] = useState<SongCorrection[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<
        { text: string; type: "success" | "error" } | null
    >(null);
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
            `Terapkan usulan perbaikan ini ke lagu "${correction.song_title}"? Lirik/chord lama akan diperbarui secara permanen.`,
        );
        if (!confirmApprove) return;

        setProcessingId(correction.id);
        setMessage(null);

        const res = await approveCorrection(
            correction.id,
            correction.song_id,
            correction.proposed_content,
        );

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
        const confirmReject = window.confirm(
            `Tolak usulan perbaikan untuk "${correction.song_title}"?`,
        );
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
        <div className="bg-surface/80 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* PANEL HEADER */}
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/20 border border-primary/40 rounded-xl text-primary">
                        <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                            Moderasi Perbaikan Chord & Lirik (Usulan Komunitas)
                            <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full border border-primary/30 font-mono font-bold">
                                {corrections.length} Antrean
                            </span>
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Tinjau usulan pembetulan chord dari pengguna
                            registered sebelum diterapkan ke lagu utama.
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadCorrections}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                    <RefreshCw
                        className={`w-3.5 h-3.5 text-primary ${
                            loading ? "animate-spin" : ""
                        }`}
                    />
                    <span>Refresh</span>
                </button>
            </div>

            {/* FEEDBACK TOAST */}
            {message && (
                <div
                    className={`p-4 mx-5 mt-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                        message.type === "success"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    }`}
                >
                    {message.type === "success"
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* PANEL BODY */}
            <div className="p-5">
                {loading
                    ? (
                        <div className="py-12 text-center text-slate-500 animate-pulse text-xs font-mono">
                            Memuat daftar usulan perbaikan...
                        </div>
                    )
                    : corrections.length === 0
                    ? (
                        <div className="py-12 text-center bg-black/40 border border-dashed border-white/10 rounded-xl p-6">
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xs font-bold text-white mb-1">
                                Semua Usulan Selesai Ditinjau
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Tidak ada antrean saran perbaikan chord saat
                                ini.
                            </p>
                        </div>
                    )
                    : (
                        <div className="space-y-4">
                            {corrections.map((item) => {
                                const isExpanded = expandedId === item.id;
                                const isProcessing = processingId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-black/60 border border-white/10 hover:border-primary/40 rounded-xl p-4 transition-all duration-200"
                                    >
                                        {/* HEADER ITEM */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-extrabold text-white">
                                                        {item.song_title}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        — {item.song_artist}
                                                    </span>
                                                    <Link
                                                        href={`/chord/${item.song_id}`}
                                                        target="_blank"
                                                        className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                        title="Lihat Lagu Asli"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>

                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                                    <span className="flex items-center gap-1 text-slate-300">
                                                        <User className="w-3 h-3 text-primary" />
                                                        {" "}
                                                        {item.user_name}
                                                        {item.user_email
                                                            ? ` (${item.user_email})`
                                                            : ""}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-mono text-slate-500">
                                                        {new Date(
                                                            item.created_at,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute:
                                                                    "2-digit",
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ACTION BUTTONS */}
                                            <div className="flex items-center gap-2 self-start md:self-auto">
                                                <button
                                                    onClick={() =>
                                                        handleApprove(item)}
                                                    disabled={isProcessing}
                                                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/50 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>
                                                        Terapkan / Approve
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleReject(item)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Tolak</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* REASON BOX */}
                                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs mb-3">
                                            <span className="font-bold text-primary flex items-center gap-1 mb-0.5">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {" "}
                                                Alasan Perbaikan Pengguna:
                                            </span>
                                            <p className="text-slate-200 font-medium">
                                                {item.reason}
                                            </p>
                                        </div>

                                        {/* PROPOSED CONTENT TOGGLE / DISPLAY */}
                                        <div>
                                            <button
                                                onClick={() =>
                                                    setExpandedId(
                                                        isExpanded
                                                            ? null
                                                            : item.id,
                                                    )}
                                                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors cursor-pointer"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-primary" />
                                                <span>
                                                    {isExpanded
                                                        ? "Sembunyikan Lirik & Chord Usulan"
                                                        : "Pratinjau Lirik & Chord Usulan Baru (+)"}
                                                </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-2 bg-black/90 border border-white/10 rounded-lg p-4 font-mono text-xs text-emerald-400 whitespace-pre leading-relaxed overflow-x-auto max-h-80 shadow-inner">
                                                    {item.proposed_content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
}
