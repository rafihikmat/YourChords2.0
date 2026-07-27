"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Minus, Plus, Settings2, Copy, Check, Pause, Type, Music, Heart, Wand2, Keyboard, X } from "lucide-react";
import { transposeChordLine, simplifyChordLine, calculateCapoTranspose } from "@/lib/transposer";
import { toggleSongFavorite, checkIsFavorite } from "@/lib/supabase";
import FretboardModal from "@/components/FretboardModal";

type ChordData = {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  content: string;
};

export default function ChordClientDetail({ data }: { data: ChordData }) {
  const [transpose, setTranspose] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isSimplified, setIsSimplified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [selectedChordForDiagram, setSelectedChordForDiagram] = useState<string | null>(null);
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);

  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); 
  const scrollRef = useRef<number | null>(null);

  // Check Favorite Status on Load
  useEffect(() => {
    if (data?.id) {
      checkIsFavorite('guest', data.id).then(fav => setIsFavorite(fav));
    }
  }, [data?.id]);

  // Toggle Favorite Action
  const handleToggleFavorite = async () => {
    if (!data?.id) return;
    const newFav = !isFavorite;
    setIsFavorite(newFav); // Optimistic UI
    await toggleSongFavorite('guest', data.id);
  };

  // Auto Scroll Engine
  useEffect(() => {
    if (autoScrollSpeed > 0) {
      const scrollSpeed = autoScrollSpeed * 0.45; 

      const scrollLoop = () => {
        window.scrollBy({ top: scrollSpeed, behavior: 'instant' });
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
          setAutoScrollSpeed(0);
        } else {
          scrollRef.current = requestAnimationFrame(scrollLoop);
        }
      };
      scrollRef.current = requestAnimationFrame(scrollLoop);
    }

    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [autoScrollSpeed]);

  // Hands-Free Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const tagName = activeElement?.tagName.toLowerCase();
      const isInputFocused = tagName === 'input' || tagName === 'textarea' || (activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setAutoScrollSpeed(prev => (prev > 0 ? 0 : 1));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setAutoScrollSpeed(prev => Math.min(5, prev + 1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setAutoScrollSpeed(prev => Math.max(0, prev - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setTranspose(prev => prev + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setTranspose(prev => prev - 1);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setIsSimplified(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTranspose = (amount: number) => {
    setTranspose(prev => prev + amount);
  };

  const adjustFontSize = (amount: number) => {
    setFontSize(prev => Math.max(12, Math.min(32, prev + amount)));
  };

  // Compute Total Transpose Steps
  const totalTransposeSteps = transpose + calculateCapoTranspose(data?.title || "", capoFret);

  const getProcessedLines = useCallback(() => {
    if (!data?.content) return [];
    const rawLines = data.content.split('\n');
    return rawLines.map(line => {
      let processed = line;
      if (isSimplified) {
        processed = simplifyChordLine(processed);
      }
      return transposeChordLine(processed, totalTransposeSteps);
    });
  }, [data?.content, isSimplified, totalTransposeSteps]);

  const copyToClipboard = async () => {
    if (!data) return;
    try {
      const fullText = getProcessedLines().join('\n');
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const coverUrl = data.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";
  const processedLines = getProcessedLines();

  const chordRegex = /\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;

  return (
    <div className="flex flex-col min-h-screen pb-40 animate-fade-in relative pt-20">
      
      {/* HEADER LAGU & TOOLS */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end mb-10 bg-surface/50 p-6 md:p-8 rounded-xl border border-white/[0.06] backdrop-blur-sm mx-4 md:mx-8 lg:mx-12">
        <div className="relative w-28 h-28 md:w-44 md:h-44 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-white/[0.06] shadow-neon-sm group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverUrl} 
            alt={data.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col flex-1 pb-1">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              {data.title}
            </h1>
            
            {/* FAVORITE BUTTON */}
            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${isFavorite ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              <span className="hidden sm:inline text-xs font-bold">{isFavorite ? 'Favorit' : 'Sukai'}</span>
            </button>
          </div>

          <h2 className="text-lg md:text-xl text-slate-400 font-medium mb-5 flex items-center gap-3">
            <span className="w-5 h-0.5 bg-primary rounded-full"></span>
            {data.artist}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Original Key Badge */}
            <div className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold tracking-widest flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" /> ORIGINAL KEY
            </div>

            {/* Transpose Badge */}
            {transpose !== 0 && (
              <div className="px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-xs font-black tracking-widest">
                TRANSPOSE: {transpose > 0 ? `+${transpose}` : transpose}
              </div>
            )}

            {/* Capo Selector */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Capo:</span>
              <select 
                value={capoFret} 
                onChange={(e) => setCapoFret(Number(e.target.value))}
                className="bg-transparent text-primary font-bold outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-900 text-white">Tanpa Capo</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-slate-900 text-white">
                    Fret {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Simplifier Toggle */}
            <button
              onClick={() => setIsSimplified(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${isSimplified ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
              title="Sederhanakan chord sulit untuk pemula"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isSimplified ? 'Chord Pemula ON' : 'Sederhanakan'}</span>
            </button>

            {/* Shortcuts Help Button */}
            <button
              onClick={() => setShowShortcutsGuide(true)}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all ml-auto"
              title="Panduan Pintas Keyboard"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CHORD DISPLAY AREA */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 relative mb-12">
        <button 
          onClick={copyToClipboard}
          className="absolute -top-12 right-4 md:top-3 md:-right-14 p-2.5 bg-surface hover:bg-surface-light rounded-lg border border-white/[0.08] text-slate-400 hover:text-primary transition-all z-30 flex items-center gap-2 text-xs font-bold"
          title="Salin Chord"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          <span className="hidden md:inline">{copied ? "Tersalin!" : "Salin"}</span>
        </button>

        <div className="bg-surface/80 p-5 md:p-8 rounded-xl border border-white/[0.06] overflow-x-auto backdrop-blur-sm shadow-xl">
          <div 
            className="font-mono text-slate-200 whitespace-pre leading-relaxed select-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: '2.0' }}
          >
            {processedLines.map((line, lineIdx) => {
              // Split line into non-chord and chord tokens for interactive clicking
              const parts = line.split(chordRegex);

              return (
                <div key={lineIdx} className="min-h-[1.8em]">
                  {parts.map((part, partIdx) => {
                    const isChordMatch = part.match(/^[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?$/);

                    if (isChordMatch) {
                      return (
                        <button
                          key={partIdx}
                          onClick={() => setSelectedChordForDiagram(part)}
                          className="text-primary font-black neon-text cursor-pointer hover:underline hover:text-white transition-all bg-primary/10 hover:bg-primary/25 px-1.5 py-0.5 rounded border border-primary/30 mx-0.5 inline-block"
                          title={`Klik untuk melihat diagram fretboard chord ${part}`}
                        >
                          {part}
                        </button>
                      );
                    }

                    return <span key={partIdx}>{part}</span>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STICKY CONTROL PANEL */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] md:w-auto min-w-[320px] max-w-3xl bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3.5 shadow-[0_10px_50px_rgba(0,0,0,0.9)] z-50 flex items-center justify-between gap-4 md:gap-6 transition-all">
        
        {/* Tool: Font Size */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase flex items-center gap-1">
            <Type className="w-2.5 h-2.5" /> Ukuran
          </span>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
            <button onClick={() => adjustFontSize(-2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white font-mono font-bold w-5 text-center text-xs">{fontSize}</span>
            <button onClick={() => adjustFontSize(2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Transpose */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">Nada</span>
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/25 rounded-lg px-1 py-0.5">
            <button onClick={() => handleTranspose(-1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-primary font-mono font-black w-7 text-center text-xs">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button onClick={() => handleTranspose(1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10"></div>

        {/* Tool: Auto Scroll */}
        <div className="flex flex-col items-center md:items-start gap-1 flex-1 md:flex-none max-w-[140px]">
          <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase flex items-center gap-1 w-full justify-between">
            <span className="flex items-center gap-1"><Settings2 className="w-2.5 h-2.5" /> Auto-Scroll</span>
            <span className="text-primary font-bold text-[10px]">{autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Off'}</span>
          </span>
          <div className="flex items-center gap-2 w-full">
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="1"
              value={autoScrollSpeed}
              onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <button 
              onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : 0)}
              className={`p-2 rounded-lg transition-all flex-shrink-0 ${autoScrollSpeed > 0 ? 'bg-primary text-white shadow-neon-sm scale-105' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
              title={autoScrollSpeed > 0 ? "Jeda Auto-Scroll (Spacebar)" : "Mulai Auto-Scroll (Spacebar)"}
            >
              {autoScrollSpeed > 0 ? <Pause className="w-3 h-3" fill="currentColor" /> : <Play className="w-3 h-3" fill="currentColor" />}
            </button>
          </div>
        </div>

      </div>

      {/* CHORD FRETBOARD DIAGRAM POPUP MODAL */}
      <FretboardModal 
        chordName={selectedChordForDiagram} 
        onClose={() => setSelectedChordForDiagram(null)} 
      />

      {/* KEYBOARD SHORTCUTS GUIDE MODAL */}
      {showShortcutsGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
            <button 
              onClick={() => setShowShortcutsGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
              <Keyboard className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Pintas Keyboard (Hands-Free)</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Play / Pause Scroll</span>
                <kbd className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold text-xs">Spacebar</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Kecepatan Scroll +/-</span>
                <kbd className="px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded font-mono font-bold text-xs">↑ / ↓</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Transpose Nada +/-</span>
                <kbd className="px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded font-mono font-bold text-xs">← / →</kbd>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-300">Toggle Chord Pemula</span>
                <kbd className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-bold text-xs">S</kbd>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button 
                onClick={() => setShowShortcutsGuide(false)}
                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-light"
              >
                Paham
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
