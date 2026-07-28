"use client";

import React, { useState, useEffect } from "react";
import { Star, BarChart2, CheckCircle2, Sparkles, Award } from "lucide-react";
import { getSongRating, submitSongRating, getDifficultyVotes, submitDifficultyVote, SongRatingData, DifficultyVoteData } from "@/lib/ratings";
import { supabase } from "@/lib/supabase";

interface SongRatingProps {
  songId: string;
  songTitle?: string;
  initialDifficulty?: string | null;
}

export default function SongRating({ songId, songTitle, initialDifficulty }: SongRatingProps) {
  const [ratingData, setRatingData] = useState<SongRatingData>({ averageRating: 4.8, totalRatings: 12 });
  const [difficultyData, setDifficultyData] = useState<DifficultyVoteData>({
    votes: { 'Sangat Mudah': 3, 'Mudah': 14, 'Sedang': 5, 'Sulit': 1 },
    totalVotes: 23,
    percentages: { 'Sangat Mudah': 13, 'Mudah': 61, 'Sedang': 22, 'Sulit': 4 },
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [difficultySubmitted, setDifficultySubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadUserAndStats() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      setUserId(currentUserId);

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
    }

    if (songId) {
      loadUserAndStats();
    }
  }, [songId]);

  const handleRate = async (star: number) => {
    setSelectedRating(star);
    setRatingSubmitted(true);
    await submitSongRating(songId, star, userId);

    // Refresh rating statistics
    const updated = await getSongRating(songId, userId);
    setRatingData(updated);

    setTimeout(() => setRatingSubmitted(false), 3000);
  };

  const handleDifficultyVote = async (level: string) => {
    setSelectedDifficulty(level);
    setDifficultySubmitted(true);
    await submitDifficultyVote(songId, level, userId);

    // Refresh difficulty statistics
    const updated = await getDifficultyVotes(songId, userId);
    setDifficultyData(updated);

    setTimeout(() => setDifficultySubmitted(false), 3000);
  };

  const difficultyLevels = [
    { label: "Sangat Mudah", color: "from-emerald-500 to-teal-400", badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
    { label: "Mudah", color: "from-blue-500 to-indigo-400", badgeBg: "bg-blue-500/20 border-blue-500/40 text-blue-300" },
    { label: "Sedang", color: "from-amber-500 to-yellow-400", badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
    { label: "Sulit", color: "from-red-500 to-rose-400", badgeBg: "bg-red-500/20 border-red-500/40 text-red-300" },
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
            Berikan nilai akurasi chord & lirik lagu ini
          </p>
        </div>

        {/* AVERAGE SCORE DISPLAY */}
        <div className="flex items-center gap-3 bg-black/60 px-4 py-2.5 rounded-xl border border-white/10">
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-400">
                {ratingData.averageRating}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ({ratingData.totalRatings} ulasan)
            </span>
          </div>

          {/* INTERACTIVE STARS */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeStar = hoverRating !== null ? star <= hoverRating : star <= Math.round(ratingData.averageRating);
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
                    } ${isUserChoice ? "scale-110" : ""}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {ratingSubmitted && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Terima kasih! Rating bintang Anda berhasil disimpan.</span>
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
            <span className="text-[10px] font-mono text-primary bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full">
              Pilihan Anda: {selectedDifficulty}
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
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
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
        <div className="flex flex-col gap-2 mt-2 bg-black/40 p-3.5 rounded-xl border border-white/10">
          {difficultyLevels.map((level) => {
            const pct = difficultyData.percentages[level.label as keyof typeof difficultyData.percentages] || 0;
            const count = difficultyData.votes[level.label as keyof typeof difficultyData.votes] || 0;

            return (
              <div key={level.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold">{level.label}</span>
                  <span className="text-slate-400">
                    {pct}% <span className="text-slate-600">({count})</span>
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
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Suara tingkat kesulitan Anda berhasil diperbarui!</span>
        </div>
      )}

    </div>
  );
}
