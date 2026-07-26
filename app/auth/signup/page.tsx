"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Supabase Auth integration
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image + Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1920&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/[0.06] rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-surface/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black tracking-tight text-white">
              Your<span className="text-primary">Chords</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Buat Akun Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Bergabunglah dengan komunitas pemain gitar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Nama Lengkap</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black/50 border border-white/[0.08] rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.15)] transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/50 border border-white/[0.08] rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.15)] transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
              <input 
                type={showPass ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-black/50 border border-white/[0.08] rounded-lg py-3 pl-11 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.15)] transition-all text-sm"
                required
                minLength={6}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-primary-light hover:shadow-neon transition-all disabled:opacity-40 text-sm mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>Daftar Sekarang <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.06]"></div>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">atau</span>
          <div className="flex-1 h-px bg-white/[0.06]"></div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/auth/signin" className="text-primary hover:text-primary-light font-semibold transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
