
import { useState, useEffect, useRef } from 'react';

// --- Merged Logic: Theme Management ---
export const useTheme = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = storedTheme === 'dark' || (!storedTheme && systemDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  return { isDark, toggleTheme };
};

// --- Merged Logic: Metronome Engine ---
export const useMetronome = (initialBpm = 120) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      scheduler();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isPlaying]);

  const cleanup = () => {
    if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      scheduleNote(nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60.0 / bpm;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25.0);
  };

  const scheduleNote = (time: number) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.frequency.value = 1000;
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  };

  return { isPlaying, setIsPlaying, bpm, setBpm };
};
