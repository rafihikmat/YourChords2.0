
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mic, Music2, Sparkles, Zap, Disc, Youtube, Filter } from 'lucide-react';
import { Spotlight } from '../components/ui/Spotlight';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import { DOT_GRID_SVG, cn } from '../lib/utils';
import SongCard from '../components/ui/SongCard';
import { Song, Album, VideoTutorial } from '../types';
import { supabase } from '../lib/supabase';

const Home: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<VideoTutorial[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [pageContent, setPageContent] = useState<any>(null);

  // Enhanced Mock Data for "Cyber-Zen" aesthetic fallback
  // IDs must be valid UUIDs to prevent database errors on Detail page
  const fallbackSongs: Song[] = [
    { id: '11111111-1111-1111-1111-111111111111', title: 'Neon Blade', artist: 'MoonDeity', chords: [], tablature: {}, difficulty: 'Expert', spotify_track_id: '123', youtube_video_id: '456', view_count: 125000 },
    { id: '22222222-2222-2222-2222-222222222222', title: 'After Dark', artist: 'Mr. Kitty', chords: [], tablature: {}, difficulty: 'Medium', spotify_track_id: '124', youtube_video_id: '457', view_count: 89000 },
    { id: '33333333-3333-3333-3333-333333333333', title: 'Nightcall', artist: 'Kavinsky', chords: [], tablature: {}, difficulty: 'Easy', spotify_track_id: '125', youtube_video_id: '458', view_count: 45000 },
    { id: '44444444-4444-4444-4444-444444444444', title: 'Resonance', artist: 'Home', chords: [], tablature: {}, difficulty: 'Medium', spotify_track_id: '126', youtube_video_id: '459', view_count: 32000 },
    { id: '55555555-5555-5555-5555-555555555555', title: 'Memory Reboot', artist: 'VØJ, Narvent', chords: [], tablature: {}, difficulty: 'Hard', spotify_track_id: '127', youtube_video_id: '460', view_count: 28000 },
    { id: '66666666-6666-6666-6666-666666666666', title: 'SimpsonWave 1995', artist: 'FrankJavCee', chords: [], tablature: {}, difficulty: 'Easy', spotify_track_id: '128', youtube_video_id: '461', view_count: 15000 }
  ];

  const fallbackAlbums: Album[] = [
      { id: 'a1', title: 'Random Access Memories', artist: 'Daft Punk', cover_url: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg' },
      { id: 'a2', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', cover_url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png' },
      { id: 'a3', title: 'Currents', artist: 'Tame Impala', cover_url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png' },
      { id: 'a4', title: 'AM', artist: 'Arctic Monkeys', cover_url: 'https://upload.wikimedia.org/wikipedia/en/0/04/Arctic_Monkeys_-_AM.png' }
  ];

  const fallbackVideos: VideoTutorial[] = [
      { video_id: 'v1', title: 'Mastering Barre Chords in 10 Mins', channel_title: 'GuitarHero', thumbnail_url: 'https://img.youtube.com/vi/d_UVn7Z_sZ8/mqdefault.jpg' },
      { video_id: 'v2', title: 'Learn Fingerstyle Fast', channel_title: 'AcousticLife', thumbnail_url: 'https://img.youtube.com/vi/C4j_4l-6Ff0/mqdefault.jpg' },
      { video_id: 'v3', title: 'Music Theory for Beginners', channel_title: 'Rick Beato', thumbnail_url: 'https://img.youtube.com/vi/Dq2W4b38yGs/mqdefault.jpg' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CMS Content
        const { data: cmsData } = await supabase.from('page_content').select('content').eq('id', 'home').single();
        if (cmsData) setPageContent(cmsData.content);

        // Fetch Songs
        const { data, error } = await supabase.from('songs').select('*').order('view_count', { ascending: false }).limit(12);
        let songList: Song[] = [];
        if (error || !data || data.length === 0) songList = fallbackSongs;
        else songList = data as unknown as Song[];
        
        setSongs(songList);
        setFilteredSongs(songList);

        // Fetch Albums (Mock logic since table might not be populated yet)
        const { data: albumData } = await supabase.from('albums').select('*').limit(4);
        if (!albumData || albumData.length === 0) setAlbums(fallbackAlbums);
        else setAlbums(albumData as any);

        // Fetch Videos (Mock logic)
        setVideos(fallbackVideos);

      } catch (err) {
        setSongs(fallbackSongs);
        setFilteredSongs(fallbackSongs);
        setAlbums(fallbackAlbums);
        setVideos(fallbackVideos);
      } finally {
        setIsLoadingSongs(false);
      }
    };

    fetchData();
  }, []);

  // Filter Logic
  useEffect(() => {
      if (difficultyFilter === 'All') {
          setFilteredSongs(songs);
      } else {
          setFilteredSongs(songs.filter(s => s.difficulty === difficultyFilter));
      }
  }, [difficultyFilter, songs]);

  const features = [
    {
      title: "AI-Powered Transcription",
      description: "Convert any song lyrics into accurate chords instantly using Gemini 2.5 Flash.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
      icon: <Sparkles className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Interactive Tablature",
      description: "View tablature synced with YouTube video tutorials.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
      icon: <Music2 className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Voice Command",
      description: "Control autoscroll and playback hands-free while you play.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
      icon: <Mic className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Instant Transpose",
      description: "Change keys in real-time with zero latency.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5" />,
      icon: <Zap className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
  ];

  // Use dynamic content or fallback defaults
  const heroTitle = pageContent?.hero_title || "Master your chords in Hyperspeed.";
  const heroSubtitle = pageContent?.hero_subtitle || "The most advanced guitar platform for the modern musician. AI-generated chords, immersive tablature, and distraction-free practice modes.";

  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col transition-colors duration-500">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      {/* Hero Section */}
      <div className="relative z-10 pt-36 pb-20 px-4 w-full flex flex-col items-center justify-center">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 hidden dark:block" fill="white" />
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium text-primary mb-8 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v2.0 is live with Gemini AI
            </div>

            <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-6" dangerouslySetInnerHTML={{__html: heroTitle.replace('Hyperspeed', '<span class="text-primary">Hyperspeed</span>')}}>
            </h1>

            <p className="text-slate-600 dark:text-neutral-400 text-lg md:text-xl max-w-2xl mb-10">
                {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => document.getElementById('library-section')?.scrollIntoView({behavior: 'smooth'})} className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-2 hover:bg-slate-900 transition-colors">
                        Explore Library <ArrowRight className="w-4 h-4" />
                    </span>
                </button>
            </div>
        </motion.div>
      </div>

      {/* Trending Songs Section */}
      <div id="library-section" className="relative z-10 px-6 pb-20 max-w-7xl mx-auto w-full scroll-mt-24">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Trending Now
            </h3>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-lg">
                {['All', 'Easy', 'Medium', 'Hard', 'Expert'].map((level) => (
                    <button
                        key={level}
                        onClick={() => setDifficultyFilter(level)}
                        className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                            difficultyFilter === level
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        {level}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[300px]">
            {filteredSongs.length > 0 ? (
                filteredSongs.slice(0, 6).map(song => (
                    <SongCard key={song.id} song={song} />
                ))
            ) : (
                <div className="col-span-3 text-center py-12 text-slate-500">
                    No songs found for this difficulty.
                </div>
            )}
            {isLoadingSongs && songs.length === 0 && (
                [1, 2, 3].map(n => (
                    <div key={n} className="h-48 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse"></div>
                ))
            )}
        </div>
      </div>

      {/* Featured Albums */}
      <div className="relative z-10 px-6 py-16 bg-slate-100 dark:bg-slate-900/50 w-full border-y border-slate-200 dark:border-white/5">
         <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                <Disc className="w-5 h-5 text-primary" /> Featured Albums
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {albums.map(album => (
                    <div key={album.id} className="group cursor-pointer">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 mb-3 shadow-lg border border-slate-200 dark:border-white/10 relative">
                            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Music2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{album.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{album.artist}</p>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Video Tutorials */}
      <div id="tutorials" className="relative z-10 px-6 py-16 max-w-7xl mx-auto w-full">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" /> Popular Tutorials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(video => (
                <div key={video.video_id} className="group cursor-pointer bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all">
                    <div className="aspect-video bg-slate-800 relative overflow-hidden">
                         <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                             </div>
                         </div>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors">{video.title}</h4>
                        <p className="text-xs text-slate-500">{video.channel_title}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 py-20">
        <BentoGrid className="max-w-4xl mx-auto">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>
      </div>
    </div>
  );
};

export default Home;
