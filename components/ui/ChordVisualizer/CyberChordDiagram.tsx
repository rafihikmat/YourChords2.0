"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { GuitarChordSVG } from "@/components/ui/ChordVisualizer/GuitarChordSVG";
import { PianoChordSVG } from "@/components/ui/ChordVisualizer/PianoChordSVG";
import { getUnifiedChordData, UnifiedChordData } from "@/lib/chordDictionary";

export interface CyberChordDiagramProps {
  chordName: string;
  initialInstrument?: "guitar" | "piano";
  showInstrumentToggle?: boolean;
  className?: string;
}

export const CyberChordDiagram: React.FC<CyberChordDiagramProps> = ({
  chordName,
  initialInstrument = "guitar",
  showInstrumentToggle = true,
  className = "",
}) => {
  const [instrument, setInstrument] = useState<"guitar" | "piano">(initialInstrument);
  const [variationIndex, setVariationIndex] = useState<number>(0);

  useEffect(() => {
    setInstrument(initialInstrument);
  }, [initialInstrument]);

  useEffect(() => {
    setVariationIndex(0);
  }, [chordName]);

  const chordData: UnifiedChordData = getUnifiedChordData(chordName);
  const guitarPositions = chordData.guitar;
  const currentGuitarData = guitarPositions[variationIndex] || guitarPositions[0];

  const totalVariations = guitarPositions.length;

  return (
    <div
      className={`relative flex flex-col items-center bg-slate-950/90 border border-purple-500/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(168,85,247,0.2)] text-white w-full max-w-sm select-none ${className}`}
    >
      {/* Background Cyber Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 bg-purple-600/15 blur-2xl rounded-full pointer-events-none" />

      {/* HEADER CARD SECTION */}
      <div className="w-full flex flex-col items-center text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-300 tracking-widest uppercase mb-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>CYBER CHORD ENGINE</span>
        </div>

        <h3 className="text-2xl font-bold text-cyan-400 tracking-tight font-mono">
          {chordData.name || "C"}
        </h3>

        {/* Chord Type Badge */}
        {currentGuitarData?.chordType && instrument === "guitar" && (
          <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full mt-1">
            {currentGuitarData.chordType}
          </span>
        )}

        {chordData.piano?.chordType && instrument === "piano" && (
          <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full mt-1">
            {chordData.piano.chordType}
          </span>
        )}
      </div>

      {/* INSTRUMENT SWITCHER TOGGLE */}
      {showInstrumentToggle && (
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-white/10 rounded-xl mb-4">
          <CyberButton
            type="button"
            variant={instrument === "guitar" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setInstrument("guitar")}
            className="text-xs font-bold"
          >
            🎸 Gitar
          </CyberButton>

          <CyberButton
            type="button"
            variant={instrument === "piano" ? "cyan" : "ghost"}
            size="sm"
            onClick={() => setInstrument("piano")}
            className="text-xs font-bold"
          >
            🎹 Piano
          </CyberButton>
        </div>
      )}

      {/* MAIN DIAGRAM CONTAINER */}
      <div className="w-full flex flex-col items-center justify-center p-3 bg-slate-900/80 rounded-2xl border border-white/10 mb-3 shadow-inner min-h-[200px]">
        {instrument === "guitar" ? (
          <GuitarChordSVG data={currentGuitarData} />
        ) : (
          <PianoChordSVG data={chordData.piano} />
        )}
      </div>

      {/* VARIATION NAVIGATOR */}
      {instrument === "guitar" && totalVariations > 1 && (
        <div className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setVariationIndex((prev) => Math.max(0, prev - 1))}
            disabled={variationIndex === 0}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Variasi Kunci Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-purple-300 tracking-wide">
            Variasi {variationIndex + 1} dari {totalVariations}
          </span>

          <button
            type="button"
            onClick={() =>
              setVariationIndex((prev) => Math.min(totalVariations - 1, prev + 1))
            }
            disabled={variationIndex === totalVariations - 1}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Variasi Kunci Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CyberChordDiagram;
