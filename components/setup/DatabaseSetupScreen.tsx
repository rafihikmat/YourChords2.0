
import React from 'react';
import { Copy, AlertTriangle, Database } from 'lucide-react';

export const DatabaseSetupScreen: React.FC = () => {
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

-- 10. HELPER FUNCTIONS
create or replace function increment_view_count(row_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.songs
  set view_count = view_count + 1
  where id = row_id;
end;
$$;
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
