"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, BarChart2, CheckCircle2, Award, LogIn } from "lucide-react";
import { 
  getSongRating, submitSongRating, getDifficultyVotes, submitDifficultyVote, voteSongDifficulty,
  SongRatingData, DifficultyVoteData 
} from "@/lib/ratings";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";

interface SongRatingProps {
  songId: string;
  songTitle?: string;
  initialDifficulty?: string | null;
}

export default function SongRating({ songId }: SongRatingProps) {
  const { user } = useAuth();

  const [ratingData, setRatingData] = useState<SongRatingData>({ averageRating: 0, totalRatings: 0 });
  const [difficultyData, setDifficultyData] = useState<DifficultyVoteData>({
    votes: { 'Sangat Mudah': 0, 'Mudah': 0, 'Sedang': 0, 'Sulit': 0 },
    totalVotes: 0,
    percentages: { 'Sangat Mudah': 0, 'Mudah': 0, 'Sedang': 0, 'Sulit': 0 },
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [difficultySubmitted, setDifficultySubmitted] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string>("");

  const loadStats = useCallback(async () => {
    if (!songId) return;

    const currentUserId = user?.id;
    const [rStats, dStats] = await Promise.all([
      getSongRating(songId, currentUserId),
      getDifficultyVotes(songId, currentUserId),
    ]);

    setRatingData(rStats);
    if (rStats.userRating) {
      setSelectedRating(rStats.userRating);
    }

    setDifficultyData(dStats);
    if (dStats.userVote) {
      setSelectedDifficulty(dStats.userVote);
    }
  }, [songId, user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle Star Rating Click
  const handleRate = async (star: number) => {
    if (!user) {
      setAuthModalReason("Silakan masuk atau daftar akun terlebih dahulu untuk memberikan rating bintang.");
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedRating(star);
    setRatingSubmitted(true);
    const success = await submitSongRating(songId, star, user.id);

    if (success) {
      await loadStats();
      setTimeout(() => setRatingSubmitted(false), 3500);
    }
  };

  // Handle Difficulty Vote Click
  const handleDifficultyVote = async (level: string) => {
    if (!user) {
      setAuthModalReason("Silakan login untuk memberikan voting kesulitan lagu.");
      setIsAuthModalOpen(true);
      return;
    }

    // Optimistic UI update
    setSelectedDifficulty(level);
    setDifficultySubmitted(true);

    try {
      await voteSongDifficulty(songId, user.id, level);
      await loadStats();
      setTimeout(() => setDifficultySubmitted(false), 3500);
    } catch (err: any) {
      console.error("[DIFFICULTY VOTE ERROR]:", err);
    }
  };

  const difficultyLevels = [
    { label: "Sangat Mudah", color: "from-emerald-500 to-teal-400" },
    { label: "Mudah", color: "from-blue-500 to-indigo-400" },
    { label: "Sedang", color: "from-amber-500 to-yellow-400" },
    { label: "Sulit", color: "from-red-500 to-rose-400" },
  ];

  return (
    <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6 text-white no-print">
      
      {/* SECTION 1: STAR RATING & REVIEWS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Rating & Ulasan Komunitas
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Berikan nilai akurasi chord & lirik lagu ini (Real-time DB)
          </p>
        </div>

        {/* AVERAGE SCORE DISPLAY & INTERACTIVE STARS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-amber-400">
              {ratingData.totalRatings > 0 ? ratingData.averageRating : "0.0"}
            </span>
            <span className="text-xs text-slate-400">/ 5.0</span>
            <span className="text-[10px] text-slate-400 font-mono ml-1">
              ({ratingData.totalRatings} ulasan)
            </span>
          </div>

          {/* INTERACTIVE STARS */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeStar = hoverRating !== null 
                ? star <= hoverRating 
                : star <= Math.round(ratingData.averageRating);
              const isUserChoice = selectedRating === star;

              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleRate(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  title={`Beri Bintang ${star}`}
                >
                  <Star
                    className={`w-5 h-5 transition-all ${
                      activeStar
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        : "text-slate-600 fill-slate-800"
                    } ${isUserChoice ? "scale-110 ring-2 ring-amber-400/50 rounded-full" : ""}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* USER RATING INDICATOR / TOAST */}
      {selectedRating && (
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Rating Anda: {selectedRating} dari 5 Bintang</span>
          </div>
          {ratingSubmitted && (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan ke DB
            </span>
          )}
        </div>
      )}

      {/* SECTION 2: COMMUNITY DIFFICULTY VOTING */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tingkat Kesulitan Komunitas ({difficultyData.totalVotes} Suara)
            </h4>
          </div>
          {selectedDifficulty && (
            <span className="text-[10px] font-mono text-primary bg-primary/20 border border-primary/30 px-2.5 py-1 rounded-full font-bold">
              Vote Anda: {selectedDifficulty}
            </span>
          )}
        </div>

        {/* DIFFICULTY OPTION BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {difficultyLevels.map((level) => {
            const isSelected = selectedDifficulty === level.label;

            return (
              <button
                key={level.label}
                type="button"
                onClick={() => handleDifficultyVote(level.label)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02]"
                    : "bg-black/50 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
                }`}
              >
                <span>{level.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        {/* PERCENTAGE PROGRESS BARS */}
        <div className="flex flex-col gap-2.5 mt-1 bg-black/40 p-4 rounded-xl border border-white/10">
          {difficultyLevels.map((level) => {
            const pct = difficultyData.percentages[level.label as keyof typeof difficultyData.percentages] || 0;
            const count = difficultyData.votes[level.label as keyof typeof difficultyData.votes] || 0;

            return (
              <div key={level.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold">{level.label}</span>
                  <span className="text-slate-400">
                    {pct}% <span className="text-slate-500">({count} suara)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${level.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {difficultySubmitted && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pilihan kesulitan Anda telah dicatat!</span>
        </div>
      )}

      {/* AUTH MODAL FOR UNAUTHENTICATED USERS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signin"
        reason={authModalReason}
      />

    </div>
  );
}
