"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Disc3, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  reason?: string;
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin", reason }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email Confirmation Screen State
  const [isConfirmationScreen, setIsConfirmationScreen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setIsConfirmationScreen(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (googleErr) throw googleErr;
    } catch (err: any) {
      console.error('[GOOGLE AUTH ERROR]:', err.message);
      setError(err.message || 'Gagal masuk dengan Google.');
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data?.user) {
        if (data?.session) {
          const maxAge = 604800; // 7 days
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }

        onClose();
        router.refresh();
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
          }
        }
      });

      if (signUpError) throw signUpError;

      // DO NOT call signInWithPassword automatically!
      // Show confirmation screen
      setConfirmationEmail(email);
      setIsConfirmationScreen(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Periksa kembali informasi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-950 border border-primary/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer z-20"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40">
              <span className="text-primary font-black text-sm">Y</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Your<span className="text-primary neon-text">Chords</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            {mode === "signin"
              ? "Masuk ke akun Anda untuk menyimpan lagu favorit dan setlist"
              : "Buat akun baru untuk bergabung dengan komunitas pemain gitar"}
          </p>
        </div>

        {/* Reason Banner */}
        {reason && (
          <div className="mb-5 p-3 rounded-xl bg-primary/15 border border-primary/40 text-primary-light text-xs text-center font-bold flex items-center justify-center gap-2 relative z-10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <span className="text-sm">🔒</span>
            <span>{reason}</span>
          </div>
        )}

        {/* EMAIL CONFIRMATION INSTRUCTION SCREEN */}
        {isConfirmationScreen ? (
          <div className="text-center py-4 relative z-10 space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 shadow-[0_0_25px_rgba(168,85,247,0.3)] mb-4 mx-auto text-primary">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Cek Inbox Email Anda!
            </h3>

            <p className="text-slate-300 text-xs leading-relaxed max-w-xs mx-auto">
              Kami telah mengirimkan link konfirmasi akun ke{" "}
              <span className="text-primary font-bold">{confirmationEmail}</span>.
              Silakan klik link tersebut untuk mengaktifkan akun Anda sebelum melakukan Sign In.
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmationScreen(false);
                  setMode("signin");
                  setError(null);
                }}
                className="w-full py-3.5 px-4 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Kembali ke Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 mb-6 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-primary text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-primary text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* GOOGLE OAUTH BUTTON & DIVIDER */}
            <div className="relative z-10 mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/15 hover:border-primary/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  ── ATAU DENGAN EMAIL ──
                </span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="flex flex-col gap-4 relative z-10">
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 transition-all text-xs font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 transition-all text-xs font-sans"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 transition-all text-xs font-sans"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-light hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 text-xs uppercase tracking-wider mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Disc3 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Masuk Ke Akun" : "Daftar Akun Sekarang"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {mode === "signin" ? (
                <p>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Daftar sekarang
                  </button>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
