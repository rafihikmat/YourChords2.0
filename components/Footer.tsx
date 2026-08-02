"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Sparkles, Shield, HelpCircle, FileText, Settings, Heart } from "lucide-react";
import { getSiteCMSContent } from "@/lib/adminCMS";

export default function Footer() {
  const [footerSlogan, setFooterSlogan] = useState<string>(
    "Belajar, latih, dan mainkan ribuan chord & lirik lagu favoritmu secara real-time. Platform musik AI-Powered terdepan untuk musisi Indonesia."
  );

  useEffect(() => {
    getSiteCMSContent()
      .then((cms) => {
        if (cms?.footerSlogan) {
          setFooterSlogan(cms.footerSlogan);
        }
      })
      .catch((err) => {
        console.warn("[CMS FOOTER FETCH ERROR]:", err);
      });
  }, []);

  return (
    <footer className="no-print border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-slate-300 relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        
        {/* TOP SECTION: BRAND & NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          {/* BRAND COLUMN (LEFT - TAKES 2 COLS ON LARGE SCREENS) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Logo with Neon Purple Glow */}
            <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-white group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary via-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">
                Your<span className="text-primary-light">Chords</span>
                <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary-light font-mono font-bold uppercase tracking-widest align-top">
                  2.0
                </span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
              {footerSlogan}
            </p>


            {/* INTERACTIVE SOCIAL MEDIA ICONS */}
            <div className="pt-2 flex items-center gap-2.5">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                title="TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
                title="Discord"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 1: JELAJAHI */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Jelajahi
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/artists" className="hover:text-primary transition-colors">
                  Artis Populer
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Setlist Komunitas
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Lagu Baru Release
                </Link>
              </li>
              <li>
                <Link href="/chords" className="hover:text-primary transition-colors">
                  Kamus Chord Gitar
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: FITUR UTAMA */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Fitur Utama
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/features" className="hover:text-violet-400 transition-colors">
                  Interactive Fretboard
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-violet-400 transition-colors">
                  Smart Transposer
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-violet-400 transition-colors">
                  Pemula Simplifier
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-violet-400 transition-colors">
                  Auto-Scroll Player
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: DUKUNGAN */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Dukungan
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/help" className="hover:text-cyan-400 transition-colors">
                  Pusat Bantuan
                </Link>
              </li>
              <li>
                <Link href="/request" className="hover:text-cyan-400 transition-colors">
                  Request Lagu Baru
                </Link>
              </li>
              <li>
                <Link href="/report-typo" className="hover:text-cyan-400 transition-colors">
                  Laporkan Typo Chord
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Komunitas Musisi
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: TENTANG */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tentang
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  Tentang YourChords
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors font-bold text-slate-300 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span>Komando Admin</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM SECTION: COPYRIGHT BAR & TAGLINE */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} YourChords. All rights reserved.</p>
          
          <p className="flex items-center gap-1.5 text-slate-400">
            Made with <span className="text-base">🤘</span> in Indonesia for Musicians Worldwide.
          </p>
        </div>

      </div>
    </footer>
  );
}
