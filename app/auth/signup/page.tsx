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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // [SECURITY 1]: HONEYPOT TRAP CHECK
    if (honeypot && honeypot.trim().length > 0) {
      console.warn("[SECURITY] Honeypot field filled. Bot submission blocked.");
      // Fake success response to confuse bot without creating account
      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman utama...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
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

      // Sync cookies if session is immediately returned
      if (data?.session) {
        const maxAge = 604800; // 7 hari
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman utama...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
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

        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Honeypot Trap Input (Hidden from real users) */}
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

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">atau</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-xs text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/auth/signin" className="text-primary hover:text-primary-light font-bold transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
