import { useState, useRef, useEffect } from 'react';

export const useTuner = () => {
    const tunerCtx = useRef<AudioContext | null>(null);
    const [activeNote, setActiveNote] = useState<string | null>(null);

    useEffect(() => {
        return () => { if(tunerCtx.current) tunerCtx.current.close(); };
    }, []);

    const playNote = (frequency: number, note: string) => {
        if (activeNote === note) return stopNote();
        stopNote();
        setActiveNote(note);
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        tunerCtx.current = ctx;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
    };

    const stopNote = () => {
        if (tunerCtx.current) {
            tunerCtx.current.close().catch(() => {});
            tunerCtx.current = null;
        }
        setActiveNote(null);
    };

    return { activeNote, playNote, stopNote };
};
