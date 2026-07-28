"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, Radio, ArrowRight } from "lucide-react";

export default function OfflineGuard() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Check initial status
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short no-print">
      <div className="bg-slate-950/90 border border-amber-500/50 rounded-full px-4 py-2 backdrop-blur-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-3 text-amber-300 text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Mode Offline Aktif</span>
        </div>

        <span className="text-white/40 font-normal">|</span>

        <Link
          href="/offline"
          className="flex items-center gap-1 text-white hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          <span>Daftar Lagu Cache</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
