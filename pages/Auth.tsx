import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { calculateStrength } from '../lib/utils';
import { AuthForm } from '../components/AuthForm';
import { Spotlight } from '../components/ui/Spotlight';

/**
 * Auth view modes.
 */
type AuthView = 'login' | 'register' | 'forgot_password';

// --- Main Page ---

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        
        const fullName = `${firstName} ${lastName}`.trim() || cleanEmail.split('@')[0];

        const { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password, 
          options: { 
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          } 
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
            setSuccessMsg("Account created! Please check your email to verify your account.");
        } else {
            setSuccessMsg("Logging in...");
        }
      } else if (view === 'forgot_password') {
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
              redirectTo: `${window.location.origin}/update-password`,
          });
          if (error) throw error;
          setSuccessMsg("If an account exists, a reset link has been sent.");
          
          // Inform Admin (Mock/Best Effort)
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-500">
      {/* Background Effects */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 hidden dark:block" fill="white" />
      
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium z-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-4"
      >
        <AuthForm 
            view={view}
            setView={setView}
            handleSubmit={handleAuth}
            handleOAuth={handleOAuth}
            loading={loading}
            error={error}
            successMsg={successMsg}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            isHuman={isHuman}
            setIsHuman={setIsHuman}
            passwordStrength={passwordStrength}
        />
      </motion.div>
    </div>
  );
};

export default Auth;
