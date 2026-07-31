"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmation Screen State
  const [isConfirmationScreen, setIsConfirmationScreen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const router = useRouter();

  // 1. Honeypot trap state
  const [honeypot, setHoneypot] = useState("");

  // 2. Time-based bot detection timestamp
  const formMountedTime = useRef<number>(Date.now());

  // 3. Interactive Math Verification & Anti-bot Checkbox
  const [mathNum1, setMathNum1] = useState(0);
  const [mathNum2, setMathNum2] = useState(0);
  const [userMathAnswer, setUserMathAnswer] = useState("");
  const [isHumanChecked, setIsHumanChecked] = useState(false);

  const generateMathPuzzle = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2..9
    const n2 = Math.floor(Math.random() * 8) + 2; // 2..9
    setMathNum1(n1);
    setMathNum2(n2);
    setUserMathAnswer("");
  };

  useEffect(() => {
    formMountedTime.current = Date.now();
    generateMathPuzzle();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[GOOGLE AUTH ERROR]:', err.message);
      setErrorMsg(err.message || 'Gagal masuk dengan Google.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // [SECURITY 1]: HONEYPOT TRAP CHECK
    if (honeypot && honeypot.trim().length > 0) {
      console.warn("[SECURITY] Honeypot field filled. Bot submission blocked.");
      setConfirmationEmail(email || "anda@example.com");
      setIsConfirmationScreen(true);
      return;
    }

    // [SECURITY 2]: TIME-BASED BOT DETECTION (<2.5s)
    const timeElapsed = Date.now() - formMountedTime.current;
    if (timeElapsed < 2500) {
      setErrorMsg("Aktivitas terdeteksi terlalu cepat. Harap coba lagi.");
      return;
    }

    // [SECURITY 3]: CLIENT-SIDE RATE LIMITER (60 Seconds)
    const lastSignupStr = typeof window !== "undefined" ? localStorage.getItem("last_signup_timestamp") : null;
    if (lastSignupStr) {
      const lastSignup = parseInt(lastSignupStr, 10);
      const timeSinceLastSignup = (Date.now() - lastSignup) / 1000;
      if (timeSinceLastSignup < 60) {
        const remaining = Math.ceil(60 - timeSinceLastSignup);
        setErrorMsg(`Tunggu ${remaining} detik sebelum mencoba mendaftar lagi.`);
        return;
      }
    }

    // [SECURITY 4]: HUMAN VERIFICATION CHECK
    if (!isHumanChecked) {
      setErrorMsg("Harap centang verifikasi 'Saya bukan robot'.");
      return;
    }

    const expectedAnswer = mathNum1 + mathNum2;
    if (parseInt(userMathAnswer.trim(), 10) !== expectedAnswer) {
      setErrorMsg("Jawaban verifikasi matematika salah. Silakan coba lagi.");
      generateMathPuzzle();
      return;
    }

    // ALL SECURITY CHECKS PASSED -> PROCEED TO SUPABASE SIGNUP
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Save timestamp to LocalStorage for Rate Limiting
      if (typeof window !== "undefined") {
        localStorage.setItem("last_signup_timestamp", Date.now().toString());
      }

      // DO NOT call signInWithPassword automatically! Show confirmation screen
      setConfirmationEmail(email);
      setIsConfirmationScreen(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftar. Periksa kembali informasi Anda.");
      generateMathPuzzle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Background Image + Dark Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1920&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* IDLIX-style Centered Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-light/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.9)] animate-fade-in my-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-black tracking-tight text-white">
              Your<span className="text-primary neon-text">Chords</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Buat Akun Baru</h1>
          <p className="text-slate-400 text-xs mt-1">Bergabunglah dengan komunitas pemain gitar YourChords</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {isConfirmationScreen ? (
          <div className="text-center py-4 space-y-5 animate-fade-in">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 shadow-[0_0_25px_rgba(168,85,247,0.3)] mb-4 mx-auto text-primary">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              Cek Inbox Email Anda!
            </h2>

            <p className="text-slate-300 text-xs leading-relaxed max-w-xs mx-auto">
              Kami telah mengirimkan link konfirmasi akun ke{" "}
              <span className="text-primary font-bold">{confirmationEmail}</span>.
              Silakan klik link tersebut untuk mengaktifkan akun Anda sebelum melakukan Sign In.
            </p>

            <div className="pt-4">
              <Link
                href="/auth/signin"
                className="w-full py-3.5 px-4 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Kembali ke Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* GOOGLE OAUTH BUTTON & DIVIDER */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Honeypot Trap Input */}
              <div className="opacity-0 absolute pointer-events-none -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website_url_hp">Website URL</label>
                <input
                  id="website_url_hp"
                  type="text"
                  name="website_url_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all text-xs font-sans"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all text-xs font-sans"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-black/80 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all text-xs font-sans"
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

              {/* Human Puzzle & Bot Check */}
              <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl space-y-3 mt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Verifikasi Keamanan (Anti-Bot)
                  </label>
                  <span className="text-[11px] font-mono font-extrabold text-primary">
                    {mathNum1} + {mathNum2} = ?
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={userMathAnswer}
                    onChange={(e) => setUserMathAnswer(e.target.value)}
                    placeholder="Jawaban angka..."
                    className="flex-1 bg-surface-dark border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-primary/60 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateMathPuzzle}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Ganti Soal"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHumanChecked}
                    onChange={(e) => setIsHumanChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/80 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium">Saya bukan robot (Human Check)</span>
                </label>
              </div>

              {/* Submit */}
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-light hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 text-xs uppercase tracking-wider mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Daftar Akun Sekarang <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Sudah punya akun?{" "}
              <Link href="/auth/signin" className="text-primary hover:text-primary-light font-bold transition-colors">
                Masuk di sini
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
