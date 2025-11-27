
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

/**
 * Interface defining the shape of the authentication context.
 */
interface AuthContextType {
  /** The current Supabase auth session. */
  session: Session | null;
  /** The current authenticated user. */
  user: User | null;
  /** The user's profile data from the database. */
  profile: Profile | null;
  /** Indicates if the auth state is currently loading. */
  loading: boolean;
  /** Indicates if there was an error connecting to the database. */
  dbConnectionError: boolean;
  /** Function to sign out the current user. */
  signOut: () => Promise<void>;
  /** Boolean indicating if the current user has admin privileges. */
  isAdmin: boolean;
  /** Boolean indicating if the current user has super admin privileges. */
  /** Boolean indicating if the current user has super admin privileges. */
  isSuperAdmin: boolean;
  /** Function to manually refresh the user's profile data. */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component that wraps the app and makes auth state available to any child component that calls `useAuth()`.
 * Handles session management, user profile fetching, and automatic profile creation if missing.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The AuthProvider component.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbConnectionError, setDbConnectionError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setDbConnectionError(true);
          setLoading(false);
          return;
        }

        if (error.code === 'PGRST116') {
           const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, role: 'user' }])
            .select()
            .single();
            
           if (!createError && newProfile) {
             setProfile(newProfile as Profile);
           }
        }
      } else {
        setProfile(data as Profile);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    dbConnectionError,
    signOut,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',

    isSuperAdmin: profile?.role === 'super_admin',
    refreshProfile: async () => {
      if (user) await fetchProfile(user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access the authentication context.
 * Must be used within an `AuthProvider`.
 *
 * @returns {AuthContextType} The auth context values.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
