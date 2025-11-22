
import React from 'react';
import { Copy, AlertTriangle, Database } from 'lucide-react';

export const DatabaseSetupScreen: React.FC = () => {
  const sqlCode = `-- DATABASE OPTIMIZATION & SECURITY FIXES
-- Run this in Supabase SQL Editor to clean up policies and fix linter warnings.

-- 1. FIX FUNCTIONS (Security Search Path)
-- Fixes "mutable-search-path" warning by explicitly setting search_path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
begin
  update public.songs
  set view_count = view_count + 1
  where id = row_id;
end;
$$;

-- 2. CLEANUP & OPTIMIZE RLS POLICIES
-- We drop existing policies to remove duplicates and then recreate them
-- using (select auth.uid()) for better performance (InitPlan).

-- === PROFILES ===
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- === ALBUMS ===
DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.albums;
DROP POLICY IF EXISTS "Admins can manage albums" ON public.albums;
DROP POLICY IF EXISTS "albums_select_public" ON public.albums;
DROP POLICY IF EXISTS "albums_admin_all" ON public.albums;

CREATE POLICY "albums_select_public" ON public.albums FOR SELECT USING (true);
CREATE POLICY "albums_admin_all" ON public.albums FOR ALL USING (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'super_admin'))
);

-- === SONGS ===
DROP POLICY IF EXISTS "Songs are viewable by everyone" ON public.songs;
DROP POLICY IF EXISTS "Authenticated users can upload songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can update songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;
DROP POLICY IF EXISTS "songs_select_public" ON public.songs;
DROP POLICY IF EXISTS "songs_insert_auth" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_modify" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_delete" ON public.songs;

CREATE POLICY "songs_select_public" ON public.songs FOR SELECT USING (true);
CREATE POLICY "songs_insert_auth" ON public.songs FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "songs_admin_modify" ON public.songs FOR UPDATE USING (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'super_admin'))
);
CREATE POLICY "songs_admin_delete" ON public.songs FOR DELETE USING (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'super_admin'))
);

-- === VIDEO TUTORIALS ===
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.video_tutorials;
DROP POLICY IF EXISTS "Admins can manage videos" ON public.video_tutorials;
DROP POLICY IF EXISTS "videos_select_public" ON public.video_tutorials;
DROP POLICY IF EXISTS "videos_admin_all" ON public.video_tutorials;

CREATE POLICY "videos_select_public" ON public.video_tutorials FOR SELECT USING (true);
CREATE POLICY "videos_admin_all" ON public.video_tutorials FOR ALL USING (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'super_admin'))
);

-- === PAGE CONTENT ===
DROP POLICY IF EXISTS "Content viewable by everyone" ON public.page_content;
DROP POLICY IF EXISTS "Admins can update content" ON public.page_content;
DROP POLICY IF EXISTS "content_select_public" ON public.page_content;
DROP POLICY IF EXISTS "content_admin_all" ON public.page_content;

CREATE POLICY "content_select_public" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "content_admin_all" ON public.page_content FOR ALL USING (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'super_admin'))
);

-- === SONG FAVORITES ===
DROP POLICY IF EXISTS "Users can view own favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.song_favorites;
DROP POLICY IF EXISTS "favorites_user_isolation" ON public.song_favorites;

-- Consolidated into one optimized policy for ALL operations
CREATE POLICY "favorites_user_isolation" ON public.song_favorites FOR ALL USING ((select auth.uid()) = user_id);

-- === SONG RATINGS ===
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.song_ratings;
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.song_ratings;
DROP POLICY IF EXISTS "ratings_select_public" ON public.song_ratings;
DROP POLICY IF EXISTS "ratings_user_manage" ON public.song_ratings;

CREATE POLICY "ratings_select_public" ON public.song_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_user_manage" ON public.song_ratings FOR ALL USING ((select auth.uid()) = user_id);

-- 3. ENSURE EXTENSIONS
create extension if not exists "uuid-ossp";
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    alert("Optimized SQL copied! Paste it into Supabase SQL Editor.");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-900 dark:text-white">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-yellow-500 mb-6">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Database Optimization Required</h1>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your database policies need to be updated to fix security warnings (search_path) and improve RLS performance (InitPlan).
          Please run the following SQL migration.
        </p>

        <div className="relative bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden group">
           <button 
            onClick={copyToClipboard}
            className="absolute top-4 right-4 p-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors z-10"
           >
             <Copy className="w-3 h-3" /> Copy SQL
           </button>
           <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto p-4 h-64 custom-scrollbar">
             {sqlCode}
           </pre>
        </div>

        <div className="mt-6 flex items-center justify-between">
           <p className="text-xs text-slate-500">This script is safe to run on existing data.</p>
           <a 
             href="https://supabase.com/dashboard/project/_/sql/new" 
             target="_blank" 
             rel="noreferrer"
             className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
           >
             <Database className="w-4 h-4" /> Open Supabase SQL Editor
           </a>
        </div>
      </div>
    </div>
  );
};
