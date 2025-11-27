
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DOT_GRID_SVG } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';

/**
 * The Update Password page component.
 * Used in the password reset flow. Users are redirected here from the email link.
 * Allows the user to set a new password for their account.
 *
 * @returns {JSX.Element} The UpdatePassword component.
 */
const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
    };
    getUser();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
    }

    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
          navigate('/');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
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

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-slate-200 dark:border-white/5 text-center">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-6 h-6 text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Update Password</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a new secure password for your account.</p>
            </div>

            <div className="p-8">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {email && (
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center mb-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Resetting password for</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{email}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                required 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                                placeholder="At least 6 characters" 
                                minLength={6} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                required 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                                placeholder="Re-enter new password" 
                                minLength={6} 
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-500/20 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs border border-green-200 dark:border-green-500/20 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Password updated! Redirecting home...</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || success} 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Update Password
                    </button>
                </form>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;
