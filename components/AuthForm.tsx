"use client";
import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandFacebook,
} from "@tabler/icons-react";
import { HoldToVerify } from "./ui/hold-to-verify";
import { Loader2 } from "lucide-react";

type AuthView = 'login' | 'register' | 'forgot_password';

interface AuthFormProps {
  view: AuthView;
  setView: (view: AuthView) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleOAuth: (provider: 'google' | 'facebook') => void;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  firstName: string;
  setFirstName: (s: string) => void;
  lastName: string;
  setLastName: (s: string) => void;
  isHuman: boolean;
  setIsHuman: (b: boolean) => void;
  passwordStrength: number;
}

export function AuthForm({
  view,
  setView,
  handleSubmit,
  handleOAuth,
  loading,
  error,
  successMsg,
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  isHuman,
  setIsHuman,
  passwordStrength
}: AuthFormProps) {
  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
            {view === 'login' ? "Welcome Back" : view === 'register' ? "Join the Network" : "Reset Access"}
        </h2>
        <p className="text-sm text-slate-400 text-center mb-8">
            {view === 'login' 
            ? "Enter your credentials to access the mainframe." 
            : view === 'register' 
                ? "Initialize your musical journey." 
                : "Recover your access key."}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
            {view === 'register' && (
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="firstname" className="text-xs uppercase tracking-wider text-slate-500">First name</Label>
                    <Input 
                        id="firstname" 
                        placeholder="Tyler" 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-primary/20"
                    />
                </div>
                <div className="flex-1 space-y-2">
                    <Label htmlFor="lastname" className="text-xs uppercase tracking-wider text-slate-500">Last name</Label>
                    <Input 
                        id="lastname" 
                        placeholder="Durden" 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-primary/20"
                    />
                </div>
            </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-slate-500">Email Address</Label>
                <Input 
                    id="email" 
                    placeholder="projectmayhem@fc.com" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-primary/20"
                />
            </div>

            {view !== 'forgot_password' && (
            <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-slate-500">Password</Label>
                <Input 
                    id="password" 
                    placeholder="••••••••" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-primary/20"
                />
                {view === 'register' && password.length > 0 && (
                    <div className="flex gap-1 h-1 px-1 mt-2">
                        {[1,2,3,4].map(i => (
                            <div 
                            key={i} 
                            className={cn(
                                "flex-1 rounded-full h-1 transition-colors duration-300", 
                                passwordStrength >= i ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"
                            )} 
                            />
                        ))}
                    </div>
                )}
            </div>
            )}

            {view === 'register' && (
                <div className="pt-2">
                    <HoldToVerify onVerify={() => setIsHuman(true)} />
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                </div>
            )}
            
            {successMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                    {successMsg}
                </div>
            )}

            <button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
            type="submit"
            disabled={loading}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? "Sign In" : view === 'register' ? "Sign Up" : "Send Reset Link")}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            {view !== 'forgot_password' && (
                <>
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/40 px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-white"
                            type="button"
                            onClick={() => handleOAuth('google')}
                        >
                            <IconBrandGoogle className="h-4 w-4" />
                            <span>Google</span>
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-white"
                            type="button"
                            onClick={() => handleOAuth('facebook')}
                        >
                            <IconBrandFacebook className="h-4 w-4" />
                            <span>Facebook</span>
                        </button>
                    </div>
                </>
            )}
        </form>

        <div className="mt-8 text-center text-sm">
            {view === 'login' ? (
                <p className="text-slate-400">
                    Don't have an account?{' '}
                    <button onClick={() => setView('register')} className="text-primary hover:text-primary/80 font-medium transition-colors">
                        Sign up
                    </button>
                </p>
            ) : (
                <p className="text-slate-400">
                    Already have an account?{' '}
                    <button onClick={() => setView('login')} className="text-primary hover:text-primary/80 font-medium transition-colors">
                        Sign in
                    </button>
                </p>
            )}
            {view !== 'forgot_password' && (
                <button onClick={() => setView('forgot_password')} className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors block w-full">
                    Forgot your password?
                </button>
            )}
            {view === 'forgot_password' && (
                 <button onClick={() => setView('login')} className="mt-4 text-primary hover:text-primary/80 font-medium transition-colors text-sm">
                    &larr; Back to Login
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
