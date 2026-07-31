"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    Award,
    BarChart2,
    CheckCircle2,
    RefreshCw,
    Search,
    Star,
    Trash2,
} from "lucide-react";
import {
    getAdminRatingsOverview,
    resetSongRatingsAndVotes,
    SongRatingModerationItem,
} from "@/lib/ratings";

interface RatingsModerationPanelProps {
    onRatingsReset?: () => void;
}

export default function RatingsModerationPanel(
    { onRatingsReset }: RatingsModerationPanelProps,
) {
    const [items, setItems] = useState<SongRatingModerationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminRatingsOverview();
            setItems(data);
        } catch (err) {
            console.error("[FETCH RATINGS OVERVIEW ERROR]:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const handleReset = async (item: SongRatingModerationItem) => {
        const confirmAsk = window.confirm(
            `Apakah Anda yakin ingin MERESET seluruh rating bintang dan vote kesulitan untuk lagu "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
        );
        if (!confirmAsk) return;

        setResettingId(item.song_id);
        try {
            const success = await resetSongRatingsAndVotes(item.song_id);
            if (success) {
                setToastMessage(
                    `Rating & vote kesulitan untuk "${item.title}" berhasil di-reset.`,
                );
                setTimeout(() => setToastMessage(null), 3500);
                await fetchOverview();
                if (onRatingsReset) onRatingsReset();
            } else {
                alert("Gagal mereset data rating.");
            }
        } catch (err: any) {
            alert(err?.message || "Terjadi kesalahan saat mereset.");
        } finally {
            setResettingId(null);
        }
    };

    const filteredItems = filter
        ? items.filter(
            (i) =>
                i.title.toLowerCase().includes(filter.toLowerCase()) ||
                i.artist.toLowerCase().includes(filter.toLowerCase()),
        )
        : items;

    return (
        <div className="bg-surface/80 rounded-2xl border border-violet-500/30 overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* PANEL HEADER */}
            <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-violet-500/5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                        <Award className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                            Moderasi Rating & Kesulitan Komunitas
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Kelola data ulasan bintang asli dan statistik vote
                            kesulitan lagu dari pengguna.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* SEARCH FILTER */}
                    <div className="relative w-48 sm:w-60">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari lagu / artis..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={fetchOverview}
                        disabled={loading}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                        title="Refresh Rating Overview"
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs font-bold text-emerald-400 flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* TABLE DATA */}
            <div className="overflow-x-auto">
                {loading
                    ? (
                        <div className="p-8 text-center text-slate-500 animate-pulse text-xs flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                            <span>
                                Memuat data agregasi rating & vote kesulitan
                                dari database...
                            </span>
                        </div>
                    )
                    : filteredItems.length === 0
                    ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            Belum ada data ulasan atau lagu yang ditemukan.
                        </div>
                    )
                    : (
                        <table className="w-full text-left text-xs">
                            <thead className="bg-black/60 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="px-5 py-3">
                                        Judul Lagu & Artis
                                    </th>
                                    <th className="px-5 py-3 text-center">
                                        Rating Bintang
                                    </th>
                                    <th className="px-5 py-3 text-center">
                                        Tingkat Kesulitan
                                    </th>
                                    <th className="px-5 py-3 text-center">
                                        Tindakan Moderasi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.song_id}
                                        className="hover:bg-violet-500/5 transition-colors group"
                                    >
                                        <td className="px-5 py-3.5 font-bold text-white">
                                            <div className="text-white group-hover:text-violet-300 transition-colors">
                                                {item.title}
                                            </div>
                                            <div className="text-slate-400 text-[11px] font-normal">
                                                {item.artist}
                                            </div>
                                        </td>

                                        {/* Rating Bintang */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1 font-mono font-extrabold text-amber-400 text-xs">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span>
                                                        {item.totalRatings > 0
                                                            ? `${item.averageRating} / 5.0`
                                                            : "Belum Ada"}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    ({item.totalRatings} ulasan)
                                                </span>
                                            </div>
                                        </td>

                                        {/* Tingkat Kesulitan */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="px-2.5 py-0.5 bg-violet-500/20 text-violet-300 font-mono font-bold border border-violet-500/40 rounded-md text-[10px]">
                                                    {item.totalDifficultyVotes}
                                                    {" "}
                                                    Suara Total
                                                </span>
                                                {item.totalDifficultyVotes >
                                                        0 && (
                                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                                                        <span className="text-emerald-400">
                                                            SM:{" "}
                                                            {item
                                                                .difficultyBreakdown[
                                                                    "Sangat Mudah"
                                                                ]}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-blue-400">
                                                            M:{" "}
                                                            {item
                                                                .difficultyBreakdown[
                                                                    "Mudah"
                                                                ]}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-amber-400">
                                                            Sd:{" "}
                                                            {item
                                                                .difficultyBreakdown[
                                                                    "Sedang"
                                                                ]}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-red-400">
                                                            Sl:{" "}
                                                            {item
                                                                .difficultyBreakdown[
                                                                    "Sulit"
                                                                ]}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Reset Actions */}
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleReset(item)}
                                                disabled={resettingId ===
                                                        item.song_id ||
                                                    (item.totalRatings === 0 &&
                                                        item.totalDifficultyVotes ===
                                                            0)}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Reset Seluruh Rating & Vote Lagu Ini"
                                            >
                                                {resettingId === item.song_id
                                                    ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    )
                                                    : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                <span>Reset Rating/Votes</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
