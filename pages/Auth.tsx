
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, UserPlus, LogIn, Fingerprint, XCircle, Globe } from 'lucide-react';
import { DOT_GRID_SVG, cn, calculateStrength } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

type AuthView = 'login' | 'register' | 'forgot_password';

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Security
  const [isHuman, setIsHuman] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const verifyTimer = useRef<number | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error_description');
    if (err) setError(decodeURIComponent(err).replace(/\+/g, ' '));
  }, [searchParams]);

  useEffect(() => { if (!authLoading && user) navigate('/'); }, [user, authLoading, navigate]);

  const verifyHuman = (start: boolean) => {
      if (isHuman) return;
      if (start) {
          setIsVerifying(true);
          let prog = 0;
          verifyTimer.current = window.setInterval(() => {
              prog += 5;
              setVerifyProgress(prog);
              if (prog >= 100) {
                  clearInterval(verifyTimer.current!);
                  setIsHuman(true); setIsVerifying(false);
              }
          }, 30);
      } else {
          if (verifyTimer.current) clearInterval(verifyTimer.current);
          setIsVerifying(false); setVerifyProgress(0);
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccessMsg(null);

    try {
        if (view === 'login') {
             const { error } = await supabase.auth.signInWithPassword({ email, password });
             if (error) throw new Error("Invalid credentials.");
        } else if (view === 'register') {
             if (!isHuman) throw new Error("Verify you are human.");
             if (calculateStrength(password) < 3) throw new Error("Password too weak.");
             const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } });
             if (error) throw error;
             setSuccessMsg(data.session ? "Logging in..." : "Verification email sent.");
        } else {
             const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
             if (error) throw error;
             setSuccessMsg("Reset link sent.");
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || "Authentication failed.");
        } else {
            setError("Authentication failed.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
      setLoading(true);
      await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
       <style>{`input:-webkit-autofill{ -webkit-box-shadow: 0 0 0 30px #0f172a inset !important; -webkit-text-fill-color: white !important; }`}</style>
       <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }} />
       <Spotlight className="-top-40 left-0" fill="white" />
       <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm z-50"><ArrowLeft className="w-4 h-4" /> Home</Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-[440px] p-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="pt-10 pb-6 px-8 text-center">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 mb-6 shadow-lg">
                    {view === 'register' ? <UserPlus className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
                 </div>
                 <h1 className="text-2xl font-bold text-white mb-2">{view === 'login' ? "Secure Login" : view === 'register' ? "Create Account" : "Reset Password"}</h1>
            </div>

            <div className="px-8 pb-10">
                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-primary/50 outline-none text-sm" placeholder="Email" />
                    </div>
                    
                    {view !== 'forgot_password' && (
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-primary/50 outline-none text-sm" placeholder="Password" />
                        </div>
                    )}

                    {view === 'register' && (
                        <>
                             <div className="flex gap-1 h-1 px-1">{[1,2,3,4].map(i => (<div key={i} className={cn("flex-1 rounded-full h-1", calculateStrength(password) >= i ? "bg-primary" : "bg-white/10")} />))}</div>
                             <div className={cn("relative h-12 rounded-xl border transition-all cursor-pointer select-none overflow-hidden", isHuman ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-primary/50")} onMouseDown={() => verifyHuman(true)} onMouseUp={() => verifyHuman(false)} onMouseLeave={() => verifyHuman(false)} onTouchStart={() => verifyHuman(true)} onTouchEnd={() => verifyHuman(false)}>
                                <div className="absolute inset-0 bg-primary/20 transition-all duration-0" style={{ width: `${isHuman ? 100 : verifyProgress}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 z-10 text-sm font-bold uppercase">{isHuman ? <><ShieldCheck className="w-4 h-4 text-green-400" /><span className="text-green-400">Verified</span></> : <><Fingerprint className="w-4 h-4 text-slate-500" /><span className="text-slate-400">Hold to Verify</span></>}</div>
                             </div>
                        </>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 disabled:opacity-70">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                        {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Link'}
                    </button>
                </form>

                <div className="mt-6 space-y-4">
                    {view !== 'forgot_password' && (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleOAuth('google')} className="py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm font-bold text-white flex items-center justify-center gap-2"><Globe className="w-4 h-4" /> Google</button>
                            <button onClick={() => handleOAuth('facebook')} className="py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm font-bold text-white flex items-center justify-center gap-2"><span className="text-blue-500 font-black">f</span> Facebook</button>
                        </div>
                    )}
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-2"><XCircle className="w-4 h-4 mt-0.5" /> {error}</div>}
                    {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5" /> {successMsg}</div>}
                    
                    <div className="text-center text-sm text-slate-400">
                         {view === 'login' ? "New here? " : "Have an account? "}
                         <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(null); }} className="text-primary font-bold hover:text-white">
                            {view === 'login' ? "Join Now" : "Sign In"}
                         </button>
                         {view === 'login' && <div className="mt-2"><button onClick={() => setView('forgot_password')} className="text-xs text-slate-500 hover:text-white">Forgot Password?</button></div>}
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
