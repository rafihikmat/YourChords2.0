
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Save, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { FileUpload } from '../components/ui/file-upload';

/**
 * The User Profile page component.
 * Allows users to view and update their profile information (name, avatar).
 *
 * @returns {JSX.Element} The ProfilePage component.
 */
const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setLoading(true);
    setMessage(null);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Image uploaded successfully. Click Save to apply.' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Error uploading image' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unknown error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6 flex justify-between items-end">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 overflow-hidden shadow-lg">
                   {avatarUrl ? (
                     <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-3xl">
                       {fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                     </div>
                   )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                {profile?.role || 'User'}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Profile Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Manage your neural identity and preferences.</p>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={user?.email} 
                      disabled 
                      className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full max-w-4xl mx-auto min-h-48 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
                <FileUpload 
                  onChange={handleFileUpload} 
                  maxSize={5 * 1024 * 1024} 
                  onError={(msg) => setMessage({ type: 'error', text: msg })}
                />
              </div>

              {message && (
                <div className={cn(
                  "p-3 rounded-lg text-sm flex items-center gap-2",
                  message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  {message.type === 'success' ? <Shield className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/25 transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Security</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xl">
                    If you logged in via Google or Facebook, you can set a password here to enable email/password login for your account.
                </p>
                <ChangePasswordForm />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setMsg({ type: 'error', text: "Passwords do not match." });
            return;
        }
        if (password.length < 6) {
            setMsg({ type: 'error', text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        setMsg(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMsg({ type: 'success', text: "Password updated successfully." });
            setPassword('');
            setConfirm('');
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">New Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="Enter new password"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Confirm Password</label>
                <input 
                    type="password" 
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="Confirm new password"
                />
            </div>
            {msg && (
                <div className={cn(
                    "p-3 rounded-lg text-sm",
                    msg.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                    {msg.text}
                </div>
            )}
            <button 
                type="submit" 
                disabled={loading || !password}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 text-sm"
            >
                {loading ? "Updating..." : "Update Password"}
            </button>
        </form>
    );
};

export default ProfilePage;
