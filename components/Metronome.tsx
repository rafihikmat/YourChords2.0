"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Music2, ChevronDown, ChevronUp, X, Minus, Plus } from "lucide-react";

interface MetronomeProps {
  initialBpm?: number;
  onClose?: () => void;
}

export default function Metronome({ initialBpm = 120, onClose }: MetronomeProps) {
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeSignature, setTimeSignature] = useState<string>("4/4");
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const bpmRef = useRef<number>(bpm);
  const timeSignatureRef = useRef<string>(timeSignature);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    timeSignatureRef.current = timeSignature;
  }, [timeSignature]);

  const beatsPerMeasure = React.useMemo(() => {
    if (timeSignature === "3/4") return 3;
    if (timeSignature === "6/8") return 6;
    return 4; // 4/4 default
  }, [timeSignature]);

  // Audio scheduler
  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    // Accent beat 1 with higher frequency (1200Hz vs 750Hz)
    const isFirstBeat = beatNumber === 0;
    osc.frequency.value = isFirstBeat ? 1200 : 750;

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.08);

    // Schedule state update for visual LED pulse
    const timeUntilNote = Math.max(0, (time - audioContextRef.current.currentTime) * 1000);
    setTimeout(() => {
      setCurrentBeat(beatNumber + 1);
    }, timeUntilNote);
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const beats = timeSignatureRef.current === "3/4" ? 3 : timeSignatureRef.current === "6/8" ? 6 : 4;
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);

      // Advance time for next note based on BPM
      const secondsPerBeat = 60.0 / bpmRef.current;
      // For 6/8, beats are eighth notes
      const effectiveBeatDuration = timeSignatureRef.current === "6/8" ? secondsPerBeat / 2 : secondsPerBeat;
      
      nextNoteTimeRef.current += effectiveBeatDuration;
      currentBeatRef.current = (currentBeatRef.current + 1) % beats;
    }

    timerIdRef.current = requestAnimationFrame(scheduler);
  };

  const startMetronome = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    currentBeatRef.current = 0;
    setCurrentBeat(0);
    nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
    setIsPlaying(true);

    scheduler();
  };

  const stopMetronome = () => {
    if (timerIdRef.current) {
      cancelAnimationFrame(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        cancelAnimationFrame(timerIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleBpmChange = (delta: number) => {
    setBpm((prev) => Math.min(240, Math.max(30, prev + delta)));
  };

  return (
    <div className="metronome-widget bg-surface/90 border border-primary/30 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all w-full max-w-sm font-sans no-print text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary">
            <Music2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
              Metronom AI
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </h4>
            <p className="text-[10px] text-slate-400">Tempo & Time Signature</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title={isMinimized ? "Perluas Widget" : "Kecilkan Widget"}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={() => {
                stopMetronome();
                onClose();
              }}
              className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup Metronom"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="mt-4 flex flex-col gap-4">
          {/* BPM DISPLAY & BEAT LEDS */}
          <div className="flex flex-col items-center justify-center bg-black/60 rounded-xl p-4 border border-white/10 relative overflow-hidden">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black font-mono tracking-tight text-white neon-text">
                {bpm}
              </span>
              <span className="text-xs text-primary font-bold uppercase">BPM</span>
            </div>

            {/* LED BEAT INDICATORS */}
            <div className="flex items-center gap-2 mt-3">
              {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
                const isActive = currentBeat === idx + 1;
                const isAccent = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-100 flex items-center justify-center ${
                      isActive
                        ? isAccent
                          ? "bg-red-500 scale-125 shadow-[0_0_12px_rgba(239,68,68,0.9)]"
                          : "bg-primary scale-125 shadow-[0_0_12px_rgba(168,85,247,0.9)]"
                        : "bg-white/10 border border-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* BPM SLIDER & STEP BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBpmChange(-1)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-bold transition-all active:scale-95 cursor-pointer"
              title="Kurangi 1 BPM"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="30"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <button
              onClick={() => handleBpmChange(1)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-bold transition-all active:scale-95 cursor-pointer"
              title="Tambah 1 BPM"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* TIME SIGNATURE SELECTOR & PLAY BUTTON */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl">
              {["4/4", "3/4", "6/8"].map((ts) => (
                <button
                  key={ts}
                  onClick={() => setTimeSignature(ts)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    timeSignature === ts
                      ? "bg-primary text-white shadow-neon-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {ts}
                </button>
              ))}
            </div>

            <button
              onClick={togglePlay}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
                isPlaying
                  ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                  : "bg-primary text-white hover:bg-primary-light shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>START</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
