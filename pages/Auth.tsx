import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Fingerprint,
  Facebook,
  Chrome
} from 'lucide-react';
import { cn, calculateStrength } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

/**
 * Auth view modes.
 */
type AuthView = 'login' | 'register' | 'forgot_password';

// --- Components ---

const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dark Mode Grid */}
      <div className="absolute inset-0 bg-slate-950 [mask-image:linear-gradient(to_bottom,transparent,black)] dark:block hidden" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:block hidden" />
      
      {/* Light Mode Grid */}
      <div className="absolute inset-0 bg-slate-50 [mask-image:linear-gradient(to_bottom,transparent,black)] dark:hidden block" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:hidden block" />
      
      {/* Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-50 dark:opacity-20" />
    </div>
  );
};

const SocialButton = ({ icon: Icon, label, onClick, className }: { icon: any, label: string, onClick: () => void, className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border transition-all duration-200",
      "bg-white dark:bg-slate-900",
      "border-slate-200 dark:border-slate-800",
      "text-slate-700 dark:text-slate-200",
      "hover:bg-slate-50 dark:hover:bg-slate-800",
      "hover:border-slate-300 dark:hover:border-slate-700",
      "shadow-sm hover:shadow",
      className
    )}
  >
    <Icon className={cn("w-4 h-4", label === "Facebook" && "text-blue-600")} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const InputField = ({ 
  icon: Icon, 
  type, 
  placeholder, 
  value, 
  onChange, 
  required 
}: { 
  icon: any, 
  type: string, 
  placeholder: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  required?: boolean 
}) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "w-full bg-white dark:bg-slate-950",
        "border border-slate-200 dark:border-slate-800",
        "text-slate-900 dark:text-white",
        "placeholder:text-slate-400",
        "rounded-xl py-3.5 pl-12 pr-4",
        "outline-none transition-all duration-200",
        "focus:border-primary focus:ring-1 focus:ring-primary/50",
        "shadow-sm"
      )}
    />
  </div>
);

const HoldToVerify = ({ onVerify }: { onVerify: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [verified, setVerified] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const start = () => {
        if (verified) return;
        intervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current!);
                    setVerified(true);
                    onVerify();
                    return 100;
                }
                return prev + 4; // Speed of verification
            });
        }, 20);
    };

    const stop = () => {
        if (verified) return;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(0);
    };

    return (
        <div 
            className={cn(
                "relative h-12 rounded-xl border overflow-hidden cursor-pointer select-none transition-all",
                verified 
                    ? "border-green-500/50 bg-green-500/10 cursor-default" 
                    : "border-slate-200 dark:border-slate-800 hover:border-primary/50 active:scale-[0.99]"
            )}
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
        >
            <div 
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 transition-all duration-0 ease-linear" 
                style={{ width: `${verified ? 100 : progress}%` }} 
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                {verified ? (
                    <>
                        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Verified Human</span>
                    </>
                ) : (
                    <>
                        <Fingerprint className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Hold to Verify</span>
                    </>
                )}
            </div>
        </div>
    );
};

// --- Main Page ---

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isHuman, setIsHuman] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error_description');
    if (err) setError(decodeURIComponent(err).replace(/\+/g, ' '));
  }, [searchParams]);

  useEffect(() => { 
    if (!authLoading && user) navigate('/'); 
  }, [user, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccessMsg(null);

    // Standardize email: trim and lowercase
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("Incorrect email or password. Please check your spelling.");
            }
            throw error;
        }
      } else if (view === 'register') {
        if (!isHuman) throw new Error("Please verify you are human.");
        // Relaxed strength check: Score >= 2 is enough (e.g. length > 5 + one number/cap)
        if (calculateStrength(password) < 2) throw new Error("Password is too weak. Please use at least 6 characters.");
        
        const { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password, 
          options: { data: { full_name: cleanEmail.split('@')[0] } } 
        });
        if (error) throw error;
        setSuccessMsg(data.session ? "Logging in..." : "Verification email sent. Please check your inbox.");
      } else if (view === 'forgot_password') {
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
              redirectTo: `${window.location.origin}/update-password`,
          });
          if (error) throw error;
          setSuccessMsg("If an account exists, a reset link has been sent.");
          
          // Inform Admin (Mock/Best Effort)
          // In a real app, we'd insert into a table. Here we'll try to insert if the table exists, else ignore.
          try {
              await supabase.from('password_resets').insert([{ email: cleanEmail, status: 'requested' }]);
          } catch (e) {
              console.warn("Could not log password reset request to admin table", e);
          }
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

  const passwordStrength = calculateStrength(password);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <GridBackground />
      
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium z-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] p-4"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300">
          
          {/* Header */}
          <div className="pt-8 pb-6 px-8 text-center">
            <motion.div 
              key={view}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-6"
            >
              <Lock className="w-6 h-6" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {view === 'login' ? "Welcome Back" : view === 'register' ? "Create Account" : "Reset Password"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {view === 'login' ? "Enter your credentials to access your account" : view === 'register' ? "Join us to start your musical journey" : "Enter your email to receive a reset link"}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleAuth} className="space-y-4">
              <InputField 
                icon={Mail} 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
              
              {view !== 'forgot_password' && (
                  <div className="space-y-2">
                      <InputField 
                        icon={Lock} 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                      {view === 'register' && password.length > 0 && (
                          <div className="flex gap-1 h-1 px-1">
                              {[1,2,3,4].map(i => (
                                  <div 
                                    key={i} 
                                    className={cn(
                                        "flex-1 rounded-full h-1 transition-colors duration-300", 
                                        passwordStrength >= i ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                                    )} 
                                  />
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {view === 'register' && (
                  <HoldToVerify onVerify={() => setIsHuman(true)} />
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? "Sign In" : view === 'register' ? "Sign Up" : "Send Reset Link")}
              </button>
            </form>

            {view !== 'forgot_password' && (
                <>
                    <div className="my-6 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      <span className="text-xs text-slate-400 font-medium uppercase">Or continue with</span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <SocialButton icon={Chrome} label="Google" onClick={() => handleOAuth('google')} />
                      <SocialButton icon={Facebook} label="Facebook" onClick={() => handleOAuth('facebook')} />
                    </div>
                </>
            )}

            {/* Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex gap-2 items-start"
                >
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm flex gap-2 items-start"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Toggle */}
            <div className="mt-8 text-center space-y-2">
              {view !== 'forgot_password' && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                      onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(null); setSuccessMsg(null); setIsHuman(false); }} 
                      className="text-primary font-bold hover:underline"
                    >
                      {view === 'login' ? "Sign up" : "Sign in"}
                    </button>
                  </p>
              )}
              
              {view === 'login' && (
                  <button 
                      onClick={() => { setView('forgot_password'); setError(null); setSuccessMsg(null); }}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                      Forgot your password?
                  </button>
              )}

              {view === 'forgot_password' && (
                  <button 
                      onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }}
                      className="text-sm text-primary font-bold hover:underline"
                  >
                      Back to Sign In
                  </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
