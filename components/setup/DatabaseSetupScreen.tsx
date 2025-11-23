
import React from 'react';
import { Copy, AlertTriangle, Database } from 'lucide-react';

export const DatabaseSetupScreen: React.FC = () => {
  const sqlCode = `-- DATABASE OPTIMIZATION & SECURITY FIXES
-- Run this in Supabase SQL Editor to clean up policies and fix linter warnings.

-- 1. FIX FUNCTIONS (Security Search Path)
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

-- === SONG FAVORITES & RATINGS ===
DROP POLICY IF EXISTS "favorites_user_isolation" ON public.song_favorites;
CREATE POLICY "favorites_user_isolation" ON public.song_favorites FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "ratings_select_public" ON public.song_ratings;
DROP POLICY IF EXISTS "ratings_user_manage" ON public.song_ratings;
CREATE POLICY "ratings_select_public" ON public.song_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_user_manage" ON public.song_ratings FOR ALL USING ((select auth.uid()) = user_id);

-- 3. INSERT DUMMY CONTENT (About & Footer)
INSERT INTO public.page_content (id, content) VALUES
(
  'about',
  '{
    "title": "Revolutionizing Music Education",
    "subtitle": "We merge advanced AI with musical passion to create the ultimate learning platform.",
    "mission_title": "Our Mission",
    "mission_text": "To democratize music theory and accessibility. We believe every song should be playable, every chord understood, and every musician empowered with the best tools available.",
    "features": [
      { "title": "Neural Analysis", "desc": "Proprietary AI algorithms dissect audio to provide 99% accurate chords." },
      { "title": "Global Library", "desc": "A user-driven database connecting musicians from every corner of the world." },
      { "title": "Real-time Tools", "desc": "Latency-free tuners and metronomes built directly into the browser." }
    ]
  }'::jsonb
),
(
  'footer',
  '{
    "brand_description": "The next-generation platform for musicians. Powered by Neural Networks to bring you accurate chords, immersive tablature, and real-time tools.",
    "columns": [
      {
        "title": "Explore",
        "links": [
          { "label": "Chord Library", "path": "/" },
          { "label": "AI Generator", "path": "/tools" },
          { "label": "Tuner & Metronome", "path": "/tools" },
          { "label": "Trending Songs", "path": "/#library-section" },
          { "label": "Tutorials", "path": "/#tutorials" }
        ]
      },
      {
        "title": "Company",
        "links": [
          { "label": "About Us", "path": "/about" },
          { "label": "Privacy Policy", "path": "#" },
          { "label": "Terms of Service", "path": "#" },
          { "label": "Contact Support", "path": "#" },
          { "label": "API Status", "path": "#" }
        ]
      }
    ],
    "socials": {
      "twitter": "https://twitter.com",
      "github": "https://github.com",
      "instagram": "https://instagram.com",
      "email": "mailto:support@yourchords.com"
    },
    "copyright_text": "YourChords AI. All rights reserved."
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. ENSURE EXTENSIONS
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
          This script also inserts dummy content for the About Page and Footer.
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
