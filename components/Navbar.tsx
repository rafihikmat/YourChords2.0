"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Disc3, LogOut, User as UserIcon, Sparkles, BookOpen, Music, HelpCircle, Compass, Shield } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import AuthModal from "@/components/AuthModal";
import CyberButton from "@/components/ui/CyberButton";
import CyberBadge from "@/components/ui/CyberBadge";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Jelajahi", href: "/search", icon: Compass },
    { name: "Kamus Chord", href: "/chords", icon: BookOpen },
    { name: "Katalog Artis", href: "/artists", icon: Music },
    { name: "Fitur Utama", href: "/features", icon: Sparkles },
    { name: "Pusat Bantuan", href: "/help", icon: HelpCircle },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-xl ${
          scrolled
            ? "bg-slate-950/85 border-purple-500/20 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.2)]"
            : "bg-slate-950/75 border-purple-500/10 shadow-lg"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-6">
          
          {/* Brand Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1px] shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-black text-lg tracking-tighter">
                  YC
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Your<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 glow-text-purple">Chords</span>
              </span>
              <CyberBadge variant="purple" size="sm" pulse>
                2.0
              </CyberBadge>
            </div>
          </Link>

          {/* Quick Search Trigger (Desktop & Tablet) */}
          <form onSubmit={handleSearch} className="relative group flex-1 max-w-sm hidden md:block">
            <button
              type="submit"
              className="absolute inset-y-0 left-3 flex items-center z-10 text-slate-400 group-focus-within:text-cyan-400 transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari lagu atau artis..."
              className="w-full bg-slate-900/60 border border-purple-500/20 rounded-xl py-2 pl-9 pr-14 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
            />
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-purple-500/20 rounded">
                Ctrl K
              </kbd>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-xs font-semibold transition-all duration-200 rounded-lg group ${
                    isActive
                      ? "text-purple-300 font-bold"
                      : "text-slate-300 hover:text-purple-300 hover:bg-purple-950/20"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Auth / Action Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-xs font-bold text-purple-300 bg-purple-950/40 border border-purple-500/30 rounded-xl hover:bg-purple-900/40 hover:border-purple-400 transition-all duration-200 flex items-center gap-1.5 shadow-glow-sm"
              >
                <Disc3 className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/70 hover:bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all duration-200 shadow-sm hover:shadow-glow-sm group"
                  title="Dashboard Saya"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1px] shadow-sm">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-[10px] text-cyan-300">
                      {profile?.full_name ? profile.full_name[0].toUpperCase() : user.email?.[0].toUpperCase() || <UserIcon className="w-3 h-3" />}
                    </div>
                  </div>
                  <span className="max-w-[100px] truncate font-medium">
                    {profile?.full_name?.split(" ")[0] || "Dashboard"}
                  </span>
                </Link>

                <CyberButton
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                </CyberButton>
              </div>
            ) : (
              <CyberButton
                variant="primary"
                size="sm"
                onClick={() => openAuthModal("signin")}
                leftIcon={<UserIcon className="w-3.5 h-3.5" />}
              >
                Masuk / Daftar
              </CyberButton>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-400 transition-colors rounded-lg bg-slate-900/50 border border-purple-500/20"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-2xl border-l border-purple-500/20 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-purple-500/15">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-white">YourChords</span>
                    <CyberBadge variant="cyan" size="sm">2.0</CyberBadge>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-purple-500/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari lagu atau artis..."
                    className="w-full bg-slate-900 border border-purple-500/20 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                </form>

                {/* Mobile Links */}
                <nav className="flex flex-col gap-1.5">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                      pathname === "/"
                        ? "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    Beranda
                  </Link>

                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                          isActive
                            ? "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                            : "text-slate-300 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}

                  {user && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        pathname === "/dashboard"
                          ? "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <UserIcon className="w-4 h-4 text-purple-400" />
                      <span>Dashboard Saya</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 rounded-xl"
                    >
                      <Disc3 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>Komando Admin</span>
                    </Link>
                  )}
                </nav>
              </div>

              {/* Mobile Auth Bottom Section */}
              <div className="pt-4 border-t border-purple-500/15">
                {user ? (
                  <CyberButton
                    variant="danger"
                    size="md"
                    onClick={handleSignOut}
                    leftIcon={<LogOut className="w-4 h-4" />}
                    className="w-full"
                  >
                    Keluar ({profile?.full_name?.split(" ")[0] || "User"})
                  </CyberButton>
                ) : (
                  <CyberButton
                    variant="primary"
                    size="md"
                    onClick={() => openAuthModal("signin")}
                    className="w-full"
                    leftIcon={<UserIcon className="w-4 h-4" />}
                  >
                    Masuk / Daftar
                  </CyberButton>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
