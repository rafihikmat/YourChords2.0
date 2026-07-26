"use client";

import React, { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Scroll detection — Navbar becomes solid black on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-black/95 backdrop-blur-md border-b border-primary/20 shadow-[0_1px_20px_rgba(168,85,247,0.1)]" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 group-hover:shadow-neon-sm transition-all duration-300">
            <span className="text-primary font-black text-sm">Y</span>
          </div>
          <span className="text-lg font-black tracking-tight text-white hidden sm:block">
            Your<span className="text-primary">Chords</span>
          </span>
        </Link>

        {/* Navigation Menu — Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Home", href: "/" },
            { label: "Cari", href: "/search" },
          ].map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group flex-1 max-w-[280px] md:max-w-xs">
          <button type="submit" className="absolute inset-y-0 left-3 flex items-center z-10">
            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors duration-200" />
          </button>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lagu atau artis..." 
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)] transition-all duration-300 font-sans"
          />
        </form>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/5 animate-fade-in">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {[
              { label: "Home", href: "/" },
              { label: "Cari", href: "/search" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
