"use client";

import React, { useState, useEffect } from "react";
import { Search, Menu, X, Disc3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-black/90 backdrop-blur-xl border-primary/30 shadow-[0_4px_30px_rgba(168,85,247,0.15)]" 
          : "bg-black/60 backdrop-blur-md border-primary/20"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3 md:gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300">
            <span className="text-primary font-black text-base tracking-tighter">Y</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Your<span className="text-primary neon-text">Chords</span>
          </span>
        </Link>

        {/* Search Bar - Desktop & Tablet */}
        <form onSubmit={handleSearch} className="relative group flex-1 max-w-sm hidden sm:block">
          <button type="submit" className="absolute inset-y-0 left-3 flex items-center z-10 text-slate-500 group-focus-within:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </button>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lagu atau artis..." 
            className="w-full bg-surface-light/80 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 focus:bg-black focus:shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all duration-300 font-sans"
          />
        </form>

        {/* Navigation & Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/setlists" 
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            📚 Setlist
          </Link>

          <Link 
            href="/admin" 
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Disc3 className="w-3.5 h-3.5 text-primary" />
            Admin
          </Link>

          
          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Sign In Button (Outline Neon) */}
          <Link 
            href="/auth/signin" 
            className="px-4 py-1.5 border border-primary/50 text-primary hover:bg-primary/10 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            Sign In
          </Link>

          {/* Sign Up Button (Solid Neon Purple) */}
          <Link 
            href="/auth/signup" 
            className="px-4 py-1.5 bg-primary text-white hover:bg-primary-light rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-2xl border-t border-primary/20 px-4 py-5 flex flex-col gap-4 animate-fade-in shadow-2xl">
          <form onSubmit={handleSearch} className="relative group w-full sm:hidden">
            <button type="submit" className="absolute inset-y-0 left-3 flex items-center z-10 text-slate-500">
              <Search className="h-4 w-4" />
            </button>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari lagu atau artis..." 
              className="w-full bg-surface-light border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/60"
            />
          </form>

          <nav className="flex flex-col gap-2 pt-1">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-primary transition-colors"
            >
              Beranda
            </Link>
            <Link 
              href="/setlists" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-primary transition-colors flex items-center gap-2"
            >
              📚 Setlist & Songbook
            </Link>
            <Link 
              href="/search" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-primary transition-colors"
            >
              Pencarian
            </Link>

            <Link 
              href="/admin" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-primary transition-colors flex items-center gap-2"
            >
              <Disc3 className="w-4 h-4 text-primary" />
              Pusat Komando Admin
            </Link>
          </nav>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <Link 
              href="/auth/signin" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 border border-primary/50 text-primary hover:bg-primary/10 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 bg-primary text-white hover:bg-primary-light rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
