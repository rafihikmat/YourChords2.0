import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Save, Loader2, Shield, Camera, Lock, Sparkles, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Spotlight } from '../components/ui/Spotlight';
import { FileUpload } from '../components/ui/file-upload';
import { useNavigate } from 'react-router-dom';

/**
 * The User Profile page component.
 * Features a modern, responsive split layout with glassmorphism effects.
 */
const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
        // Optional: navigate('/auth'); 
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    try {
        await signOut();
        navigate('/');
    } catch (error) {
        console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-slate-50 dark:bg-black transition-colors duration-500">
      <Spotlight className="-top-40 left-0 hidden dark:block opacity-50" fill="white" />
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Identity Card */}
            <div className="lg:col-span-4 space-y-6">
                <IdentityCard user={user} profile={profile} refreshProfile={refreshProfile} />
                
                {/* Navigation Menu (Desktop) */}
                <div className="hidden lg:block bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1",
                            activeTab === 'general' 
                                ? "bg-primary/10 text-primary" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                    >
                        <User className="w-4 h-4" /> General Settings
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                            activeTab === 'security' 
                                ? "bg-primary/10 text-primary" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                    >
                        <Lock className="w-4 h-4" /> Security
                    </button>
                </div>

                {/* Sign Out Button */}
                 <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            {/* Right Column: Settings Panel */}
            <div className="lg:col-span-8">
                {/* Mobile Tabs */}
                <div className="flex lg:hidden mb-6 bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'general' ? "bg-primary text-white shadow-md" : "text-slate-600 dark:text-slate-400"
                        )}
                    >
                        <User className="w-4 h-4" /> General
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === 'security' ? "bg-primary text-white shadow-md" : "text-slate-600 dark:text-slate-400"
                        )}
                    >
                        <Lock className="w-4 h-4" /> Security
                    </button>
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden min-h-[500px]"
                >
                    {activeTab === 'general' ? (
                        <GeneralSettings user={user} profile={profile} refreshProfile={refreshProfile} />
                    ) : (
                        <SecuritySettings user={user} />
                    )}
                </motion.div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const IdentityCard = ({ user, profile, refreshProfile }: { user: any, profile: any, refreshProfile: () => void }) => {
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (files: File[]) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date() })
                .eq('id', user?.id);

            if (updateError) throw updateError;
            
            await refreshProfile();
        } catch (error) {
            console.error("Avatar upload failed:", error);
            alert("Failed to upload avatar.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20"></div>
            
            <div className="relative flex flex-col items-center mt-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group/avatar">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-white text-4xl font-bold">
                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        
                        {/* Hover Overlay for Upload */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                             <label className="cursor-pointer flex flex-col items-center text-white text-xs font-medium">
                                <Camera className="w-6 h-6 mb-1" />
                                <span>Change</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAvatarUpload(Array.from(e.target.files))} />
                             </label>
                        </div>
                        
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900" title="Online"></div>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{profile?.full_name || 'Anonymous User'}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>

                <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    {profile?.role || 'User'}
                </div>
            </div>
        </div>
    );
};

const GeneralSettings = ({ user, profile, refreshProfile }: { user: any, profile: any, refreshProfile: () => void }) => {
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) setFullName(profile.full_name || '');
    }, [profile]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, updated_at: new Date() })
                .eq('id', user?.id);

            if (error) throw error;
            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" /> General Settings
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and preferences.</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Enter your full name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            value={user?.email || ''}
                            disabled
                            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-slate-400">Email address cannot be changed directly.</p>
                </div>

                {message && (
                    <div className={cn(
                        "p-4 rounded-xl text-sm flex items-center gap-2",
                        message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {message.type === 'success' ? <Shield className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

const SecuritySettings = ({ user }: { user: any }) => {
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
        <div className="p-8">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-6 h-6 text-green-500" /> Security Settings
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Update your password and secure your account.</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
                <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-sm mb-1">Note for Social Login Users</h4>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                    If you signed in with Google or Facebook, setting a password here will allow you to also log in with your email and this password.
                </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Enter new password"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>

                {msg && (
                    <div className={cn(
                        "p-4 rounded-xl text-sm flex items-center gap-2",
                        msg.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {msg.text}
                    </div>
                )}

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading || !password}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Update Password
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
