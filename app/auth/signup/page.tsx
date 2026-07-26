"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

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

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman utama...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftar. Periksa kembali informasi Anda.");
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
      <div className="relative z-10 w-full max-w-md bg-surface-light/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.9)] animate-fade-in">
        
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          {/* Submit */}
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-light hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 text-xs uppercase tracking-wider mt-1"
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
