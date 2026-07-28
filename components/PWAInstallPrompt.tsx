"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Sparkles, Smartphone, CheckCircle2 } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA SW REGISTERED]: Scope is", reg.scope))
        .catch((err) => console.warn("[PWA SW ERROR]:", err));
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[95] animate-fade-in no-print">
      <div className="bg-slate-950/90 border border-primary/40 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-between gap-3 text-white">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/20 border border-primary/40 rounded-xl text-primary flex-shrink-0">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-white">
              <span>Install YourChords PWA</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Akses cepat tanpa browser & latihan gitar secara offline!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:bg-primary-light transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
