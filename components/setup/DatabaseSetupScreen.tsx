
import React, { useState } from 'react';
import { Copy, AlertTriangle, Database, Terminal, Server, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DatabaseSetupScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'database' | 'backend'>('database');

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
    "founded_text": "Founded in 2024 by RJ. Powered by RJ.",
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
    "made_by_text": "Neural Architects",
    "copyright_text": "YourChords AI. All rights reserved."
  }'::jsonb
),
(
  'home',
  '{
    "hero_title": "Master your chords in Hyperspeed.",
    "hero_subtitle": "The most advanced guitar platform for the modern musician. AI-generated chords, immersive tablature, and distraction-free practice modes."
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. ENSURE EXTENSIONS
create extension if not exists "uuid-ossp";
`;

  const backendCommands = `# 1. Login to Supabase CLI (if not logged in)
npx supabase login

# 2. Link your local project to your remote Supabase project
# Replace <project-ref> with your Reference ID from Supabase Dashboard URL (e.g., 'qgfktfjwnpycremegeme')
npx supabase link --project-ref <project-ref>

# 3. Deploy Edge Functions (The "Brain" of the App)
npx supabase functions deploy generate-chords --no-verify-jwt
npx supabase functions deploy search-youtube --no-verify-jwt
npx supabase functions deploy search-spotify --no-verify-jwt
npx supabase functions deploy scrape-song --no-verify-jwt
npx supabase functions deploy get-video-details --no-verify-jwt

# 4. Set Environment Secrets (Required for APIs to work)
# You need to get these keys from Google Cloud Console and Spotify Developer Dashboard
npx supabase secrets set API_KEY="your_google_gemini_api_key"
npx supabase secrets set YOUTUBE_API_KEY="your_youtube_data_api_key"
npx supabase secrets set SPOTIFY_CLIENT_ID="your_spotify_client_id"
npx supabase secrets set SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# Done! The backend is now live.`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-900 dark:text-white font-sans">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-black/20 p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Server className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">System Setup Console</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Complete these steps to activate the full platform.</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('database')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                        activeTab === 'database' 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                >
                    <Database className="w-4 h-4" /> 1. Database
                </button>
                <button 
                    onClick={() => setActiveTab('backend')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                        activeTab === 'backend' 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                >
                    <Terminal className="w-4 h-4" /> 2. Backend Logic
                </button>
            </div>
        </div>
        
        <div className="p-8">
            {activeTab === 'database' ? (
                <div className="animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-start gap-4 mb-6 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/30">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-yellow-700 dark:text-yellow-500 text-sm">Required: Run SQL Migration</h3>
                            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                                Your database needs structure. This script creates tables, fixes security policies, and inserts dummy content for About/Footer pages.
                            </p>
                        </div>
                    </div>

                    <div className="relative bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden group">
                        <button 
                            onClick={() => copyToClipboard(sqlCode)}
                            className="absolute top-4 right-4 p-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors z-10 shadow-lg"
                        >
                            <Copy className="w-3 h-3" /> Copy SQL
                        </button>
                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto p-4 h-80 custom-scrollbar">
                            {sqlCode}
                        </pre>
                    </div>

                    <div className="mt-6 flex justify-end">
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
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-start gap-4 mb-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-700/30">
                        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-blue-700 dark:text-blue-500 text-sm">Required: Deploy Edge Functions</h3>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                                The AI Generator and Search features live in "Edge Functions". These must be deployed using your terminal.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-inner relative group">
                             <button 
                                onClick={() => copyToClipboard(backendCommands)}
                                className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition-colors z-10"
                            >
                                <Copy className="w-3 h-3" /> Copy Commands
                            </button>
                            <code className="block font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                                {backendCommands}
                            </code>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
                             <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                <span>Get <strong>Google Gemini API Key</strong> from Google AI Studio.</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                <span>Get <strong>YouTube API Key</strong> from Google Cloud Console.</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                <span>Get <strong>Spotify Keys</strong> from Spotify for Developers.</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                         <p className="text-xs text-slate-400">Run these commands in your project root terminal.</p>
                         <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            <CheckCircle2 className="w-4 h-4" /> I've Deployed Everything
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
