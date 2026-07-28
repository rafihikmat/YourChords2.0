"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Eye, Edit3, Sparkles, CheckCircle2, AlertTriangle, 
  Music, Youtube, Image as ImageIcon, Gauge, RefreshCw, Wand2, X 
} from "lucide-react";
import { getSongForEdit, updateSongDetails } from "@/lib/adminCMS";
import FretboardModal from "@/components/FretboardModal";
import { Song } from "@/lib/types";

const DIFFICULTY_OPTIONS = [
  { value: "Sangat Mudah", label: "Sangat Mudah", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "Mudah", label: "Mudah", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Sedang", label: "Sedang", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "Sulit", label: "Sulit", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

const QUICK_TAGS = ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Reff]", "[Bridge]", "[Outro]"];

function parseContentToString(rawContent: any): string {
  if (!rawContent) return "";
  if (typeof rawContent === "string") return rawContent;
  if (typeof rawContent === "object") {
    // Jika berbentuk object JSON (misal { text: "..." } atau { chords: "..." } atau { content: "..." })
    if (rawContent.text && typeof rawContent.text === "string") return rawContent.text;
    if (rawContent.chords && typeof rawContent.chords === "string") return rawContent.chords;
    if (rawContent.content && typeof rawContent.content === "string") return rawContent.content;
    try {
      return JSON.stringify(rawContent, null, 2);
    } catch {
      return String(rawContent);
    }
  }
  return String(rawContent);
}

export default function AdminEditSongPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  // Form State
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [difficulty, setDifficulty] = useState("Sedang");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [spotifyTrackId, setSpotifyTrackId] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor"); // For mobile tabs
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  // Fetch initial song data
  const loadSongData = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    const res = await getSongForEdit(songId);

    if (res.success && res.data) {
      const song = res.data;
      setTitle(song.title || "");
      setArtist(song.artist || "");
      setContent(parseContentToString(song.chords || song.content));
      setCoverUrl(song.cover_url || "");
      setDifficulty(song.difficulty || "Sedang");
      setYoutubeVideoId(song.youtube_video_id || "");
      setSpotifyTrackId(song.spotify_track_id || "");
    } else {
      setToast({ text: res.error || "Gagal memuat data lagu.", type: "error" });
    }
    setLoading(false);
  }, [songId]);

  useEffect(() => {
    loadSongData();
  }, [loadSongData]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setToast({ text: "Judul dan Artis wajib diisi!", type: "error" });
      return;
    }

    setSaving(true);
    setToast(null);

    const payload: Partial<Song> = {
      title,
      artist,
      content,
      chords: content,
      cover_url: coverUrl,
      difficulty,
      youtube_video_id: youtubeVideoId,
      spotify_track_id: spotifyTrackId,
    };

    const res = await updateSongDetails(songId, payload);
    setSaving(false);

    if (res.success) {
      setToast({ text: "Perubahan berhasil disimpan!", type: "success" });
      setTimeout(() => setToast(null), 4000);
      router.refresh();
    } else {
      setToast({ text: res.error || "Gagal menyimpan perubahan.", type: "error" });
    }
  };

  // Quick tag insert helper
  const insertQuickTag = (tag: string) => {
    setContent((prev) => {
      const suffix = prev.endsWith("\n") || !prev ? "" : "\n";
      return prev + suffix + tag + "\n";
    });
  };

  // Chord Parser for Live Preview
  const CHORD_REGEX_GLOBAL = /\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  const CHORD_SPLIT_REGEX = /(\b[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\b)/g;
  const SINGLE_CHORD_REGEX = /^([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)$/;

  const renderPreviewLine = (line: string, lineIdx: number) => {
    const trimmed = line.trim();

    // Section Tag Line (e.g. [Intro], [Reff])
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return (
        <div key={lineIdx} className="text-primary font-bold font-mono text-sm mt-4 mb-1 border-b border-primary/20 pb-1 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>{trimmed}</span>
        </div>
      );
    }

    // Check if line looks like a chord line
    const matches = line.match(CHORD_REGEX_GLOBAL);
    const nonSpaceChars = line.replace(/\s/g, '').length;
    const matchChars = matches ? matches.join('').length : 0;
    const isChordLine = matches && matches.length > 0 && (matchChars / (nonSpaceChars || 1) > 0.35);

    if (isChordLine) {
      // Split line keeping exact chords and spaces/delimiters
      const parts = line.split(CHORD_SPLIT_REGEX);
      return (
        <div key={lineIdx} className="font-mono text-sm py-1 font-bold flex flex-wrap items-center">
          {parts.map((part, pIdx) => {
            if (SINGLE_CHORD_REGEX.test(part)) {
              return (
                <span
                  key={pIdx}
                  onClick={() => setSelectedChord(part.trim())}
                  className="inline-block px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold border border-primary/30 cursor-pointer hover:bg-primary hover:text-white transition-all font-mono text-xs shadow-[0_0_8px_rgba(168,85,247,0.3)] hover:scale-105 my-0.5 mx-0.5"
                  title={`Klik untuk melihat diagram chord ${part.trim()}`}
                >
                  {part}
                </span>
              );
            }
            return <span key={pIdx} className="whitespace-pre text-slate-300">{part}</span>;
          })}
        </div>
      );
    }

    // Standard Lyric Line
    return (
      <div key={lineIdx} className="font-mono text-sm text-slate-200 py-0.5 leading-relaxed">
        {line || "\u00A0"}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-mono">Memuat Visual Chord Editor CMS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col pb-24">
      
      {/* FIXED TOP HEADER */}
      <header className="sticky top-0 z-40 bg-surface/90 border-b border-white/10 backdrop-blur-xl px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md uppercase">
                Visual Chord CMS Editor
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white truncate max-w-md mt-0.5">
              Edit: {title || "Tanpa Judul"} <span className="text-slate-400 font-normal">{artist ? `— ${artist}` : ""}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Mobile Tab Switcher Toggle */}
          <div className="flex sm:hidden bg-black/60 border border-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'editor' ? 'bg-primary text-white' : 'text-slate-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview' ? 'bg-primary text-white' : 'text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-white hover:bg-primary-light font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs md:text-sm"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN SPLIT-VIEW CONTENT AREA (2 COLUMNS) */}
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 pt-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: FORM INPUTS & CHORD TEXTAREA EDITOR */}
        <div className={`flex flex-col gap-5 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-surface/80 p-5 md:p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Edit3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Formulir Rincian Lagu
              </h2>
            </div>

            {/* Title & Artist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-primary" /> Judul Lagu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Bintang di Surga"
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-primary" /> Nama Artis / Band <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Contoh: Noah / Peterpan"
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            {/* Difficulty Level Radio Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-primary" /> Level Kesulitan Main
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                      difficulty === opt.value
                        ? `${opt.color} shadow-sm border-primary/60 scale-[1.02]`
                        : "bg-black/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Youtube ID & Cover URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Video ID
                </label>
                <input
                  type="text"
                  value={youtubeVideoId}
                  onChange={(e) => setYoutubeVideoId(e.target.value)}
                  placeholder="Contoh: dQw4w9WgXcQ"
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 text-xs font-mono"
                />
              </div>
            </div>

            {/* QUICK TAG INSERTER */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-primary" /> Quick Insert Bagian Lagu
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertQuickTag(tag)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-primary/20 hover:border-primary/40 border border-white/10 text-slate-300 hover:text-primary rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* CHORD & LYRICS TEXTAREA */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Editor Teks Chord & Lirik:</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {parseContentToString(content).split("\n").length} Baris Teks
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder={`[Intro]\nAm F C G\n\n[Verse 1]\nAm          F\nDi suatu malam yang dingin...`}
                className="w-full bg-black/90 border border-white/10 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all font-mono text-xs md:text-sm leading-relaxed"
              />
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEW */}
        <div className={`flex flex-col gap-5 ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-surface/80 p-5 md:p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4 h-full">
            
            {/* Live Preview Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Live Real-Time Preview
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Auto Update
              </span>
            </div>

            {/* Preview Song Header Banner */}
            <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface border border-white/10 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop"}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {title || "Judul Lagu Belum Diisi"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {artist || "Artis Belum Diisi"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.color || "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}>
                    {difficulty}
                  </span>
                  {youtubeVideoId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <Youtube className="w-3 h-3" /> Player Ready
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Sheet Container */}
            <div className="bg-black/90 p-6 rounded-xl border border-white/10 flex-1 overflow-y-auto max-h-[600px] shadow-inner">
              {parseContentToString(content).trim().length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-xs italic font-mono">
                  Ketikkan chord dan lirik di kolom editor untuk melihat tampilan live preview di sini...
                </div>
              ) : (
                <div className="space-y-1">
                  {parseContentToString(content).split("\n").map((line, idx) => renderPreviewLine(line, idx))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* FRETBOARD MODAL IF CHORD CLICKED */}
      <FretboardModal
        chordName={selectedChord}
        onClose={() => setSelectedChord(null)}
      />

    </div>
  );
}
