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

interface AceternityAuthFormProps {
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

export function AceternityAuthForm({
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
}: AceternityAuthFormProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl p-4 md:p-8 bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 text-center mb-2">
        {view === 'login' ? "Welcome Back" : view === 'register' ? "Join YourChords" : "Reset Password"}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-8">
        {view === 'login' 
          ? "Login to access your personalized library" 
          : view === 'register' 
            ? "Start your musical journey today" 
            : "Enter your email to receive a reset link"}
      </p>

      <form className="my-4" onSubmit={handleSubmit}>
        {view === 'register' && (
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="firstname">First name</Label>
              <Input 
                id="firstname" 
                placeholder="Tyler" 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="lastname">Last name</Label>
              <Input 
                id="lastname" 
                placeholder="Durden" 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </LabelInputContainer>
          </div>
        )}

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            placeholder="projectmayhem@fc.com" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelInputContainer>

        {view !== 'forgot_password' && (
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              placeholder="••••••••" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {view === 'register' && password.length > 0 && (
                <div className="flex gap-1 h-1 px-1 mt-2">
                    {[1,2,3,4].map(i => (
                        <div 
                        key={i} 
                        className={cn(
                            "flex-1 rounded-full h-1 transition-colors duration-300", 
                            passwordStrength >= i ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-800"
                        )} 
                        />
                    ))}
                </div>
            )}
          </LabelInputContainer>
        )}

        {view === 'register' && (
             <div className="mb-8">
                <HoldToVerify onVerify={() => setIsHuman(true)} />
             </div>
        )}

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 dark:text-red-400 text-sm">
                {error}
            </div>
        )}
        
        {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-600 dark:text-green-400 text-sm">
                {successMsg}
            </div>
        )}

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? <Loader2 className="mx-auto w-5 h-5 animate-spin" /> : (view === 'login' ? "Sign In" : view === 'register' ? "Sign Up" : "Send Reset Link")}
          <BottomGradient />
        </button>

        {view !== 'forgot_password' && (
            <>
                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                <div className="flex flex-col space-y-4">
                <button
                    className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                    type="button"
                    onClick={() => handleOAuth('google')}
                >
                    <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Google
                    </span>
                    <BottomGradient />
                </button>
                <button
                    className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                    type="button"
                    onClick={() => handleOAuth('facebook')}
                >
                    <IconBrandFacebook className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Facebook
                    </span>
                    <BottomGradient />
                </button>
                </div>
            </>
        )}

        <div className="mt-8 text-center space-y-2">
            {view !== 'forgot_password' && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                    type="button"
                    onClick={() => { setView(view === 'login' ? 'register' : 'login'); }} 
                    className="text-neutral-800 dark:text-neutral-100 font-bold hover:underline"
                >
                    {view === 'login' ? "Sign up" : "Sign in"}
                </button>
                </p>
            )}
            
            {view === 'login' && (
                <button 
                    type="button"
                    onClick={() => { setView('forgot_password'); }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                    Forgot your password?
                </button>
            )}

            {view === 'forgot_password' && (
                <button 
                    type="button"
                    onClick={() => { setView('login'); }}
                    className="text-sm text-neutral-800 dark:text-neutral-100 font-bold hover:underline"
                >
                    Back to Sign In
                </button>
            )}
        </div>

      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
