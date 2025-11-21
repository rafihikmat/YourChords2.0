
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ChatPage from './pages/Chat';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import AdminDashboard from './pages/admin/AdminDashboard';
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 z-0"></div>
       
       <div className="relative z-10 max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 text-yellow-500 mb-6 border-b border-yellow-500/10 pb-6">
             <div className="p-3 bg-yellow-500/10 rounded-xl">
                <ShieldAlert className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white">Missing Environment Configuration</h1>
                <p className="text-slate-400 text-sm">System cannot initialize Neural Uplink</p>
             </div>
          </div>

          <div className="space-y-6">
             <p className="text-slate-300 leading-relaxed">
                To connect <strong>YourChords</strong> to the backend, you must create a <code className="text-yellow-400 font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded">.env</code> file in the project root.
             </p>

             <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-semibold">
                   <span>Required Variables</span>
                   <button onClick={copyToClipboard} className="flex items-center gap-1 hover:text-white transition-colors">
                      <Copy className="w-3 h-3" /> Copy Snippet
                   </button>
                </div>
                <div className="relative group">
                   <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto shadow-inner">
                      {envExample}
                   </pre>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="https://supabase.com/dashboard/project/_/settings/api" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-sm font-medium"
                >
                   <Database className="w-4 h-4 text-green-400" />
                   Get Supabase Keys
                </a>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-sm font-medium"
                >
                   <Key className="w-4 h-4 text-blue-400" />
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
  const sqlCode = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. SONGS
create table if not exists public.songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  chords jsonb,
  tablature jsonb,
  difficulty text,
  spotify_track_id text,
  youtube_video_id text,
  view_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.songs enable row level security;
create policy "Songs are viewable by everyone" on public.songs for select using (true);
create policy "Admins can insert songs" on public.songs for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);
create policy "Admins can update songs" on public.songs for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 3. ALBUMS
create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  cover_url text,
  release_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.albums enable row level security;
create policy "Albums are viewable by everyone" on public.albums for select using (true);

-- 4. FAVORITES
create table if not exists public.song_favorites (
  user_id uuid references auth.users on delete cascade not null,
  song_id uuid references public.songs on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, song_id)
);

alter table public.song_favorites enable row level security;
create policy "Users can view own favorites" on public.song_favorites for select using (auth.uid() = user_id);
create policy "Users can add favorites" on public.song_favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove favorites" on public.song_favorites for delete using (auth.uid() = user_id);

-- 5. RATINGS
create table if not exists public.song_ratings (
  user_id uuid references auth.users on delete cascade not null,
  song_id uuid references public.songs on delete cascade not null,
  rating int check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, song_id)
);

alter table public.song_ratings enable row level security;
create policy "Ratings are viewable by everyone" on public.song_ratings for select using (true);
create policy "Users can add/update own ratings" on public.song_ratings for all using (auth.uid() = user_id);

-- 6. AI QUEUE
create table if not exists public.ai_song_queue (
  id uuid default gen_random_uuid() primary key,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  generated_song_id uuid references public.songs,
  requested_by uuid references auth.users,
  input_data jsonb, 
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.ai_song_queue enable row level security;
create policy "Admins can view queue" on public.ai_song_queue for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 7. TRIGGERS
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
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    alert("SQL copied! Paste it into Supabase SQL Editor.");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-3xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-red-500 mb-6">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Database Setup Required</h1>
        </div>
        
        <p className="text-slate-400 mb-6">
          The table <code className="bg-slate-800 px-1 py-0.5 rounded text-white">profiles</code> does not exist in your Supabase project. 
          Please execute the following SQL migration to initialize the database structure.
        </p>

        <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-hidden group">
           <button 
            onClick={copyToClipboard}
            className="absolute top-4 right-4 p-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors z-10"
           >
             <Copy className="w-3 h-3" /> Copy SQL
           </button>
           <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-4 h-64 custom-scrollbar">
             {sqlCode}
           </pre>
        </div>

        <div className="mt-6 flex items-center justify-between">
           <p className="text-xs text-slate-500">After running this SQL, refresh this page.</p>
           <a 
             href="https://supabase.com/dashboard/project/_/sql/new" 
             target="_blank" 
             rel="noreferrer"
             className="px-6 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading Neural Interface...</div>;
  
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { dbConnectionError } = useAuth();

  // Global check for DB error
  if (dbConnectionError) return <DatabaseSetupScreen />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Placeholders for new pages */}
        <Route path="/about" element={<div className="pt-24 text-center text-white">About Page (Coming Soon)</div>} />
        <Route path="/favorites" element={
            <ProtectedRoute>
                <div className="pt-24 text-center text-white">My Favorites (Coming Soon)</div>
            </ProtectedRoute>
        } />
        <Route path="/profile" element={
            <ProtectedRoute>
                <div className="pt-24 text-center text-white">User Profile (Coming Soon)</div>
            </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  // Keys are now properly configured in lib/supabase.ts and lib/gemini.ts using the provided values.
  // We can proceed directly to the application without blocking for missing env vars.

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 overflow-x-hidden">
            <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
