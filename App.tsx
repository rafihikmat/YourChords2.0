
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ChatPage from './pages/Chat';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // Import Footer
import Auth from './pages/Auth';
import AdminDashboard from './pages/admin/AdminDashboard';
import SongDetail from './pages/SongDetail';
import FavoritesPage from './pages/Favorites';
import ToolsPage from './pages/Tools';
import ProfilePage from './pages/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Database, Copy, AlertTriangle, Key, ShieldAlert } from 'lucide-react';

// --- Environment Setup Component ---
const EnvSetupScreen: React.FC = () => {
  const envExample = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
API_KEY=your-google-gemini-api-key`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envExample);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white font-sans">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 z-0"></div>
       
       <div className="relative z-10 max-w-2xl w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 text-yellow-600 dark:text-yellow-500 mb-6 border-b border-yellow-500/10 pb-6">
             <div className="p-3 bg-yellow-500/10 rounded-xl">
                <ShieldAlert className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Missing Environment Configuration</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">System cannot initialize Neural Uplink</p>
             </div>
          </div>

          <div className="space-y-6">
             <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                To connect <strong>YourChords</strong> to the backend, you must create a <code className="text-yellow-600 dark:text-yellow-400 font-mono bg-yellow-100 dark:bg-yellow-400/10 px-1.5 py-0.5 rounded">.env</code> file in the project root.
             </p>

             <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-semibold">
                   <span>Required Variables</span>
                   <button onClick={copyToClipboard} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Copy className="w-3 h-3" /> Copy Snippet
                   </button>
                </div>
                <div className="relative group">
                   <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-800 dark:text-green-400 overflow-x-auto shadow-inner">
                      {envExample}
                   </pre>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="https://supabase.com/dashboard/project/_/settings/api" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                >
                   <Database className="w-4 h-4 text-green-500 dark:text-green-400" />
                   Get Supabase Keys
                </a>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                >
                   <Key className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                   Get Gemini API Key
                </a>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- SQL Setup Component ---
const DatabaseSetupScreen: React.FC = () => {
  const sqlCode = `-- Enable UUID extension for generating unique IDs
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Mengelola data user)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Keamanan) untuk Profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. ALBUMS (Kategori Album)
create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  cover_url text,
  release_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS untuk Albums
alter table public.albums enable row level security;

drop policy if exists "Albums are viewable by everyone" on public.albums;
create policy "Albums are viewable by everyone" on public.albums for select using (true);

drop policy if exists "Admins can manage albums" on public.albums;
create policy "Admins can manage albums" on public.albums for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 3. SONGS (Data Lagu Utama & Chords)
create table if not exists public.songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  chords jsonb, 
  tablature jsonb,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard', 'Expert')),
  spotify_track_id text,
  youtube_video_id text,
  file_path text, 
  view_count int default 0,
  album_id uuid references public.albums(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS untuk Songs
alter table public.songs enable row level security;

drop policy if exists "Songs are viewable by everyone" on public.songs;
create policy "Songs are viewable by everyone" on public.songs for select using (true);

drop policy if exists "Authenticated users can upload songs" on public.songs;
create policy "Authenticated users can upload songs" on public.songs for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update songs" on public.songs;
create policy "Admins can update songs" on public.songs for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

drop policy if exists "Admins can delete songs" on public.songs;
create policy "Admins can delete songs" on public.songs for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 4. VIDEO TUTORIALS (Referensi Belajar)
create table if not exists public.video_tutorials (
  id uuid default gen_random_uuid() primary key,
  video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS untuk Videos
alter table public.video_tutorials enable row level security;

drop policy if exists "Videos are viewable by everyone" on public.video_tutorials;
create policy "Videos are viewable by everyone" on public.video_tutorials for select using (true);

drop policy if exists "Admins can manage videos" on public.video_tutorials;
create policy "Admins can manage videos" on public.video_tutorials for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 5. PAGE CONTENT (CMS Sederhana)
create table if not exists public.page_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS untuk CMS
alter table public.page_content enable row level security;

drop policy if exists "Content viewable by everyone" on public.page_content;
create policy "Content viewable by everyone" on public.page_content for select using (true);

drop policy if exists "Admins can update content" on public.page_content;
create policy "Admins can update content" on public.page_content for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

insert into public.page_content (id, content) values 
('home', '{"hero_title": "Master your chords in Hyperspeed.", "hero_subtitle": "The most advanced guitar platform for the modern musician."}'),
('about', '{"title": "About YourChords", "description": "Built for the future of music learning."}')
on conflict (id) do nothing;

-- 6. SONG FAVORITES (Bookmark User)
create table if not exists public.song_favorites (
  user_id uuid references auth.users on delete cascade not null,
  song_id uuid references public.songs on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, song_id)
);

alter table public.song_favorites enable row level security;

drop policy if exists "Users can view own favorites" on public.song_favorites;
create policy "Users can view own favorites" on public.song_favorites for select using (auth.uid() = user_id);

drop policy if exists "Users can add favorites" on public.song_favorites;
create policy "Users can add favorites" on public.song_favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove favorites" on public.song_favorites;
create policy "Users can remove favorites" on public.song_favorites for delete using (auth.uid() = user_id);

-- 7. SONG RATINGS (Rating Bintang)
create table if not exists public.song_ratings (
  user_id uuid references auth.users on delete cascade not null,
  song_id uuid references public.songs on delete cascade not null,
  rating int check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, song_id)
);

alter table public.song_ratings enable row level security;

drop policy if exists "Ratings are viewable by everyone" on public.song_ratings;
create policy "Ratings are viewable by everyone" on public.song_ratings for select using (true);

drop policy if exists "Users can manage own ratings" on public.song_ratings;
create policy "Users can manage own ratings" on public.song_ratings for all using (auth.uid() = user_id);

-- 8. OTOMATISASI USER BARU (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. STORAGE BUCKETS (Untuk File Lagu)
insert into storage.buckets (id, name, public) 
values ('song-files', 'song-files', true) 
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'song-files' );

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'song-files' and auth.role() = 'authenticated' );
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    alert("SQL copied! Paste it into Supabase SQL Editor.");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-900 dark:text-white">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-red-500 mb-6">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Database Setup Required</h1>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The table <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-900 dark:text-white">profiles</code> does not exist in your Supabase project. 
          Please execute the following SQL migration to initialize the database structure.
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
           <p className="text-xs text-slate-500">After running this SQL, refresh this page.</p>
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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isAdmin, loading, dbConnectionError } = useAuth();

  // If DB is missing tables, stop everything and show setup screen
  if (dbConnectionError) return <DatabaseSetupScreen />;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">Loading Neural Interface...</div>;
  
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { dbConnectionError } = useAuth();
  const location = useLocation();

  // Global Check: If environment variables are missing, show setup screen immediately
  // This prevents "Invalid login credentials" error caused by fallback to dummy Supabase project
  const hasEnv = (import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (!hasEnv) return <EnvSetupScreen />;

  // Global Check: If DB connection has issues (missing tables), show SQL setup
  if (dbConnectionError) return <DatabaseSetupScreen />;

  // Determine if footer should be shown (Hide on Admin and Auth pages)
  const showFooter = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/auth');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/tools" element={<ToolsPage />} />
            
            {/* Protected Routes */}
            <Route path="/favorites" element={
                <ProtectedRoute>
                    <FavoritesPage />
                </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfilePage />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
                <AdminDashboard />
            </ProtectedRoute>
            } />
            
            <Route path="/about" element={<div className="pt-24 text-center text-slate-900 dark:text-white">About Page (Coming Soon)</div>} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-primary/30 overflow-x-hidden transition-colors duration-300">
            <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
