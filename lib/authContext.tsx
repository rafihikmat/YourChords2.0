/**
 * Supabase Auth Context for YourChords 2.0 (Next.js App Router)
 * Salvaged and refactored from legacy contexts/AuthContext.tsx
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Session as SupabaseSession,
  User as SupabaseUser,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "super_admin";
}

interface AuthContextType {
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = (
  { children },
) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncCookies = (sess: SupabaseSession | null) => {
    if (typeof document === "undefined") return;
    if (sess) {
      const maxAge = 604800; // 7 days
      document.cookie =
        `sb-access-token=${sess.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie =
        `sb-refresh-token=${sess.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `sb-refresh-token=; path=/; max-age=0; SameSite=Lax`;
    }
  };

  useEffect(() => {
    // Initial Session Fetch
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      syncCookies(initSession);
      if (initSession?.user) {
        fetchProfile(initSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Realtime Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        syncCookies(currentSession);

        if (
          event === "SIGNED_IN" || event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          if (currentSession?.user) {
            fetchProfile(currentSession.user.id);
          } else {
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          setLoading(false);
        } else {
          if (currentSession?.user) {
            fetchProfile(currentSession.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Auto-create profile if not found
        if (error.code === "PGRST116") {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert([{ id: userId, role: "user" }])
            .select()
            .single();

          if (newProfile) setProfile(newProfile as Profile);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    syncCookies(null);
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role === "admin" || profile?.role === "super_admin",
    refreshProfile: async () => {
      if (user) await fetchProfile(user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
