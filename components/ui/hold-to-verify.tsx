import React, { useState, useRef } from 'react';
import { ShieldCheck, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export const HoldToVerify = ({ onVerify }: { onVerify: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [verified, setVerified] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const start = () => {
        if (verified) return;
        intervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current!);
                    setVerified(true);
                    onVerify();
                    return 100;
                }
                return prev + 4; // Speed of verification
            });
        }, 20);
    };

    const stop = () => {
        if (verified) return;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(0);
    };

    return (
        <div 
            className={cn(
                "relative h-12 rounded-xl border overflow-hidden cursor-pointer select-none transition-all",
                verified 
                    ? "border-green-500/50 bg-green-500/10 cursor-default" 
                    : "border-slate-200 dark:border-slate-800 hover:border-primary/50 active:scale-[0.99]"
            )}
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
        >
            <div 
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 transition-all duration-0 ease-linear" 
                style={{ width: `${verified ? 100 : progress}%` }} 
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                {verified ? (
                    <>
                        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Verified Human</span>
                    </>
                ) : (
                    <>
                        <Fingerprint className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Hold to Verify</span>
                    </>
                )}
            </div>
        </div>
    );
};
