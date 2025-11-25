
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, User, Sun, Moon, LogOut, Shield, Heart, Info, Menu, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import SearchBar from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../lib/hooks';

/**
 * The main navigation bar component.
 * Handles responsive layout, theme toggling, user authentication status, and navigation links.
 * Adapts appearance based on scroll position.
 *
 * @returns {JSX.Element | null} The Navbar component, or null on admin/auth pages.
 */
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  if (location.pathname.startsWith('/admin') || location.pathname === '/auth') return null;

  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b",
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200 dark:border-white/10 py-3 shadow-lg shadow-black/5"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-lg group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow duration-300">
                <Music className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden sm:block">
                Your<span className="text-primary">Chords</span>
            </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
                <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1">
                    <Info className="w-4 h-4" /> About
                </Link>
                <Link to="/tools" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Tools
                </Link>
                {user && (
                    <Link to="/favorites" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1">
                        <Heart className="w-4 h-4" /> Favorites
                    </Link>
                )}
            </div>
        </div>

        <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchBar variant="navbar" />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="relative">
                <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                >
                    {userAvatar ? (
                        <img src={userAvatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {userName.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-sm font-medium hidden sm:block max-w-[80px] truncate text-slate-700 dark:text-slate-200">
                        {userName}
                    </span>
                </button>

                {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl py-1 z-50">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Signed in as</p>
                            <p className="text-sm font-medium truncate text-slate-900 dark:text-white mt-1">{user.email}</p>
                        </div>
                        
                        <div className="p-1">
                            <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                                <User className="w-4 h-4" /> Profile
                            </Link>
                             <Link to="/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg md:hidden">
                                <Heart className="w-4 h-4" /> Favorites
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg font-medium">
                                    <Shield className="w-4 h-4" /> Admin Dashboard
                                </Link>
                            )}
                        </div>
                        
                        <div className="p-1 border-t border-slate-200 dark:border-white/5">
                            <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>
                <Link to="/auth" className="flex items-center gap-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-full transition-all shadow-lg shadow-primary/25">
                    Sign In
                </Link>
            </div>
          )}

          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 p-4 space-y-4 absolute w-full shadow-2xl">
            <SearchBar variant="full" />
            <div className="flex flex-col gap-2">
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-900 dark:text-white font-medium">About</Link>
                <Link to="/tools" onClick={() => setMobileMenuOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-900 dark:text-white font-medium">Tools</Link>
                {user && <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-900 dark:text-white font-medium">Favorites</Link>}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
