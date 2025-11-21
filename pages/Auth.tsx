
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, UserPlus, LogIn, Fingerprint, XCircle, Globe, Music } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

type AuthView = 'login' | 'register' | 'forgot_password';

// --- Security Helpers ---
const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 7) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 4
};

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  
  // Security State
  const [isHuman, setIsHuman] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const verifyTimerRef = useRef<number | null>(null);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rateLimitTime, setRateLimitTime] = useState<number>(0);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // --- Redirect Errors ---
  useEffect(() => {
    const errorDesc = searchParams.get('error_description');
    if (errorDesc) {
        setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
    }
  }, [searchParams]);

  // --- Auto Redirect ---
  useEffect(() => {
    if (!authLoading && user) navigate('/');
  }, [user, authLoading, navigate]);

  // --- Rate Limiting ---
  useEffect(() => {
      if (rateLimitTime > 0) {
          const timer = setInterval(() => setRateLimitTime(prev => prev - 1), 1000);
          return () => clearInterval(timer);
      }
  }, [rateLimitTime]);

  const handleRateLimit = () => {
      const attempts = parseInt(localStorage.getItem('auth_attempts') || '0');
      if (attempts > 4) {
          setRateLimitTime(30);
          localStorage.setItem('auth_attempts', '0');
          return true;
      }
      localStorage.setItem('auth_attempts', (attempts + 1).toString());
      return false;
  };

  // --- Verification Logic ---
  const handleVerifyStart = () => {
      if (isHuman) return;
      setIsVerifying(true);
      let progress = 0;
      verifyTimerRef.current = window.setInterval(() => {
          progress += 4;
          setVerifyProgress(progress);
          if (progress >= 100) {
              if (verifyTimerRef.current) clearInterval(verifyTimerRef.current);
              setIsHuman(true);
              setIsVerifying(false);
          }
      }, 20);
  };

  const handleVerifyEnd = () => {
      if (isHuman) return;
      if (verifyTimerRef.current) clearInterval(verifyTimerRef.current);
      setIsVerifying(false);
      setVerifyProgress(0);
  };

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitTime > 0 || honeypot) return;

    setLoading(true);
    setError(null);

    if (handleRateLimit()) {
        setError("Too many attempts. Please wait 30 seconds.");
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          setError("Invalid login credentials.");
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitTime > 0 || honeypot) return;

    if (!isHuman) {
        setError("Please verify you are human below.");
        return;
    }

    if (calculateStrength(password) < 3) {
        setError("Password is too weak.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
       const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split('@')[0] },
            emailRedirectTo: `${window.location.origin}/auth`,
          }
       });

       if (error) {
           setError(error.message);
       } else {
           if (data.session) {
               setSuccessMsg("Account created! Logging in...");
           } else {
               setSuccessMsg("Verification email sent to " + email);
               setPassword('');
           }
       }
    } catch (err: any) {
        setError("Registration failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (honeypot) return;
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/update-password`,
          });
          if (error) throw error;
          setSuccessMsg("If an account exists, a reset link has been sent.");
      } catch (err: any) {
          setError("Unable to process request.");
      } finally {
          setLoading(false);
      }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError(null);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  const switchTo = (newView: AuthView) => {
      setError(null);
      setSuccessMsg(null);
      setIsHuman(false);
      setView(newView);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
       {/* Global Styles for Autofill Visibility */}
       <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
            -webkit-text-fill-color: white !important;
            caret-color: white !important;
        }
       `}</style>

       <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-20"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      <Spotlight className="-top-40 left-0" fill="white" />

      {/* Back Link */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group z-50">
         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[440px] p-4"
      >
        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
            
            {/* Card Header */}
            <div className="pt-10 pb-6 px-8 text-center relative z-10">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 mb-6 shadow-lg shadow-primary/30">
                    {view === 'register' ? <UserPlus className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
                 </div>
                 
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            {view === 'login' && "Secure Login"}
                            {view === 'register' && "Create Account"}
                            {view === 'forgot_password' && "Reset Password"}
                        </h1>
                        <p className="text-xs font-bold tracking-widest uppercase text-slate-500">
                            {view === 'login' && "ENTER YOUR CREDENTIALS"}
                            {view === 'register' && "JOIN THE NETWORK"}
                            {view === 'forgot_password' && "RECOVER ACCESS"}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Card Body */}
            <div className="px-8 pb-10 relative z-10">
                <AnimatePresence mode="wait">
                    {/* --- LOGIN FORM --- */}
                    {view === 'login' && (
                        <motion.form 
                            key="login"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleLogin}
                            className="space-y-5"
                        >
                            <input type="text" name="honeypot" className="hidden" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                            
                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm" 
                                        placeholder="Email Address" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="password" 
                                        required 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm" 
                                        placeholder="Password" 
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => switchTo('forgot_password')} className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">Forgot Password?</button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || rateLimitTime > 0} className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-white/10 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                {rateLimitTime > 0 ? `Wait ${rateLimitTime}s` : 'Sign In'}
                            </button>
                        </motion.form>
                    )}

                    {/* --- REGISTER FORM --- */}
                    {view === 'register' && (
                        <motion.form 
                            key="register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleRegister}
                            className="space-y-5"
                        >
                             <input type="text" name="honeypot" className="hidden" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm" 
                                        placeholder="Email Address" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="password" 
                                        required 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm" 
                                        placeholder="Password" 
                                    />
                                </div>
                                {/* Minimal Strength Meter */}
                                <div className="flex gap-1 h-1 mt-2 px-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={cn("flex-1 rounded-full transition-colors h-1", calculateStrength(password) >= i ? (calculateStrength(password) === 4 ? "bg-green-500" : "bg-primary") : "bg-white/10")} />
                                    ))}
                                </div>
                            </div>

                            {/* Biometric Verify Button */}
                            <div 
                                className={cn(
                                    "relative h-14 rounded-xl overflow-hidden border transition-all select-none cursor-pointer group",
                                    isHuman ? "bg-green-500/10 border-green-500/50" : "bg-slate-950/50 border-white/10 hover:border-primary/50"
                                )}
                                onMouseDown={handleVerifyStart}
                                onMouseUp={handleVerifyEnd}
                                onMouseLeave={handleVerifyEnd}
                                onTouchStart={handleVerifyStart}
                                onTouchEnd={handleVerifyEnd}
                            >
                                <div 
                                    className="absolute top-0 left-0 bottom-0 bg-primary/20 transition-[width] ease-linear duration-0"
                                    style={{ width: `${isHuman ? 100 : verifyProgress}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
                                    {isHuman ? (
                                        <ShieldCheck className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <Fingerprint className={cn("w-6 h-6 text-slate-500 group-hover:text-primary transition-colors", isVerifying && "animate-pulse text-primary")} />
                                    )}
                                    <span className={cn("font-bold text-sm uppercase tracking-wider", isHuman ? "text-green-400" : "text-slate-400 group-hover:text-white transition-colors")}>
                                        {isHuman ? "Identity Verified" : (isVerifying ? "Verifying..." : "Hold to Verify")}
                                    </span>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !isHuman || rateLimitTime > 0} className="w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                {rateLimitTime > 0 ? `Wait ${rateLimitTime}s` : 'Create Account'}
                            </button>
                        </motion.form>
                    )}

                    {/* --- FORGOT PASSWORD --- */}
                    {view === 'forgot_password' && (
                        <motion.form 
                            key="forgot"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleResetPassword}
                            className="space-y-5"
                        >
                            <input type="text" name="honeypot" className="hidden" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                <p className="text-xs text-blue-200 leading-relaxed">
                                    Enter your email. We'll send a secure link to reset your access credentials.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm" 
                                        placeholder="Email Address" 
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading || rateLimitTime > 0} className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                Send Reset Link
                            </button>
                            
                            <button type="button" onClick={() => switchTo('login')} className="w-full py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors">
                                Cancel
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
                
                {/* Social Login & Errors */}
                <div className="mt-8 space-y-6">
                    {view !== 'forgot_password' && (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-[#0B1121] px-3 text-slate-600 rounded-full">Or Connect With</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-white">
                                    <Globe className="w-4 h-4" /> Google
                                </button>
                                <button onClick={() => handleOAuth('facebook')} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-white">
                                    <span className="text-blue-500 font-black text-lg leading-none">f</span> Facebook
                                </button>
                            </div>
                        </>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{successMsg}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {view !== 'forgot_password' && (
                        <div className="text-center text-sm text-slate-400">
                            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => switchTo(view === 'login' ? 'register' : 'login')} className="text-primary font-bold hover:text-white transition-colors">
                                {view === 'login' ? "Join Now" : "Sign In"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
