
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Music, Mail, Lock, ArrowRight, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Detect errors returned in URL hash (Common with OAuth failures)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error_description')) {
        try {
            const params = new URLSearchParams(hash.substring(1)); // Remove #
            const errorDesc = params.get('error_description');
            if (errorDesc) {
                setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
                // Clean URL without reloading
                window.history.replaceState(null, '', window.location.pathname);
            }
        } catch (e) {
            console.error("Error parsing hash", e);
        }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split('@')[0] }, // Default name from email
          }
        });
        
        if (error) throw error;

        // Check if session was created immediately (Email Confirmation Disabled)
        if (data.session) {
            navigate('/');
        } else {
            // Email Confirmation Enabled
            alert('Registration successful! Please check your email for verification link.');
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Provide more user-friendly error messages
      if (err.message.includes('rate limit')) {
         setError('Too many attempts. Please wait a moment or check your email.');
      } else if (err.message.includes('User already registered')) {
         setError('This email is already registered. Please sign in.');
      } else {
         setError(err.message);
      }
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
            options: {
                redirectTo: window.location.origin,
                // Force consent prompt for Google to allow account switching
                queryParams: provider === 'google' ? {
                    access_type: 'offline',
                    prompt: 'consent',
                } : undefined,
            },
        });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden p-4">
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      <Spotlight className="-top-40 left-0 hidden dark:block" fill="white" />

      <div className="absolute top-8 left-8 z-20">
         <Link to="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
             <ArrowLeft className="w-4 h-4" /> Back to Home
         </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg shadow-primary/20">
                    <Music className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {isLogin ? 'Enter your credentials to access your chords' : 'Join the future of music learning'}
                </p>
            </div>

            {/* Form */}
            <div className="p-8">
                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button 
                        type="button"
                        onClick={() => handleOAuth('google')}
                        className="relative group flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-sm font-medium text-slate-700 dark:text-white overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleOAuth('facebook')}
                        className="relative group flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1877F2] hover:bg-[#1864D9] border border-transparent rounded-lg transition-all text-sm font-medium text-white overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-400"
                                placeholder="musician@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-400"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-500/20 flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-2 font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>Authentication Error</span>
                            </div>
                            <p>{error}</p>
                            {error.includes('configuration') && (
                                <p className="mt-1 text-[10px] opacity-80">Developer Note: Check your OAuth Redirect URIs in Supabase and Provider Dashboard.</p>
                            )}
                        </motion.div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-medium py-2.5 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            {isLogin ? 'Register Now' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
