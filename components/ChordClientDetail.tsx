"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Minus, Plus, Settings2, Copy, Check, Pause, Type, Music } from "lucide-react";
import { transposeChordLine } from "@/lib/transposer";

type ChordData = {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  content: string;
};

export default function ChordClientDetail({ data }: { data: ChordData }) {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [copied, setCopied] = useState(false);
  
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); 
  const scrollRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      const scrollSpeed = autoScrollSpeed * 0.4; 

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

  const handleTranspose = (amount: number) => {
    setTranspose(prev => prev + amount);
  };

  const adjustFontSize = (amount: number) => {
    setFontSize(prev => Math.max(12, Math.min(32, prev + amount)));
  };

  const getTransposedText = () => {
    if (!data?.content) return "";
    const lines = data.content.split('\n');
    return lines.map(line => transposeChordLine(line, transpose)).join('\n');
  };

  const copyToClipboard = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(getTransposedText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const coverUrl = data.cover_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";

  return (
    <div className="flex flex-col min-h-screen pb-40 animate-fade-in relative pt-20">
      
      {/* HEADER LAGU */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end mb-12 bg-surface/50 p-6 md:p-8 rounded-xl border border-white/[0.06] backdrop-blur-sm mx-4 md:mx-8 lg:mx-12">
        <div className="relative w-28 h-28 md:w-44 md:h-44 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-white/[0.06] shadow-neon-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverUrl} 
            alt={data.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col pb-1">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2 md:mb-3">
            {data.title}
          </h1>
          <h2 className="text-lg md:text-xl text-slate-400 font-medium mb-5 flex items-center gap-3">
             <span className="w-5 h-0.5 bg-primary rounded-full"></span>
            {data.artist}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-bold tracking-widest flex items-center gap-1.5">
              <Music className="w-3 h-3" /> ORIGINAL KEY
            </div>
            {transpose !== 0 && (
              <div className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-xs font-black tracking-widest">
                TR: {transpose > 0 ? `+${transpose}` : transpose}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHORD AREA */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 relative mb-12">
        <button 
          onClick={copyToClipboard}
          className="absolute -top-12 right-4 md:top-2 md:-right-14 p-2.5 bg-surface hover:bg-surface-light rounded-lg border border-white/[0.08] text-slate-400 hover:text-primary transition-all z-30"
          title="Salin Chord"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <div className="bg-surface/80 p-5 md:p-8 rounded-xl border border-white/[0.06] overflow-x-auto backdrop-blur-sm">
          <pre 
            className="font-mono text-slate-200 whitespace-pre-wrap sm:whitespace-pre selection:bg-primary/30 outline-none leading-relaxed"
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
            dangerouslySetInnerHTML={{
              __html: getTransposedText()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g, function(match) {
                  return `<span class="text-primary font-bold neon-text">${match}</span>`;
                })
            }}
          />
        </div>
      </div>

      {/* STICKY CONTROL PANEL */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] md:w-auto min-w-[320px] max-w-2xl bg-black/90 backdrop-blur-2xl border border-white/[0.08] rounded-xl px-5 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.8)] z-50 flex items-center justify-between gap-5 transition-all">
        
        {/* Tool: Font Size */}
        <div className="flex flex-col items-center gap-1 flex-1 md:flex-none">
          <span className="text-[9px] text-slate-500 font-bold tracking-[0.15em] uppercase flex items-center gap-1"><Type className="w-2.5 h-2.5" /> Teks</span>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-1 py-0.5 border border-white/[0.06]">
            <button onClick={() => adjustFontSize(-2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white font-mono font-bold w-5 text-center text-xs">{fontSize}</span>
            <button onClick={() => adjustFontSize(2)} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-white/[0.06]"></div>

        {/* Tool: Transpose */}
        <div className="flex flex-col items-center gap-1 flex-1 md:flex-none">
          <span className="text-[9px] text-slate-500 font-bold tracking-[0.15em] uppercase">Nada</span>
          <div className="flex items-center gap-1 bg-primary/[0.08] border border-primary/20 rounded-lg px-1 py-0.5">
            <button onClick={() => handleTranspose(-1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-primary font-mono font-black w-6 text-center text-xs">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button onClick={() => handleTranspose(1)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-white/[0.06]"></div>

        {/* Tool: Auto Scroll */}
        <div className="flex flex-col items-center md:items-start gap-1 flex-1 md:flex-none w-full max-w-[130px]">
          <span className="text-[9px] text-slate-500 font-bold tracking-[0.15em] uppercase flex items-center gap-1 w-full justify-between">
            <span className="flex items-center gap-1"><Settings2 className="w-2.5 h-2.5" /> Scroll</span>
            <span className="text-primary text-[10px]">{autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Off'}</span>
          </span>
          <div className="flex items-center gap-2 w-full">
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="1"
              value={autoScrollSpeed}
              onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <button 
              onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : 0)}
              className={`p-2 rounded-lg transition-all flex-shrink-0 ${autoScrollSpeed > 0 ? 'bg-primary text-white shadow-neon-sm scale-105' : 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]'}`}
            >
              {autoScrollSpeed > 0 ? <Pause className="w-3 h-3" fill="currentColor" /> : <Play className="w-3 h-3" fill="currentColor" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
