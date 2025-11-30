
import React, { useEffect, useState, Suspense } from 'react';
import { Song, Album } from '../types';
import { supabase } from '../lib/supabase';
// Lazy load heavy VideoGallery component
const VideoGallery = React.lazy(() => import('../components/VideoGallery').then(module => ({ default: module.VideoGallery })));
import { seedDatabase } from '../lib/seeder';
import { useNavigate } from 'react-router-dom';
import { HomeHero } from '../components/home/HomeHero';
import { TrendingSection } from '../components/home/TrendingSection';
import { FeaturedAlbums } from '../components/home/FeaturedAlbums';

/**
 * The Home page component (Landing Page).
 * Displays the hero section, trending songs, featured albums, and video tutorials.
 * Handles data fetching, filtering by difficulty, and database seeding.
 *
 * @returns {JSX.Element} The Home page component.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pageContent, setPageContent] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
      setIsLoadingSongs(true);
      setFetchError(null);
      try {
        // 1. Content
        const { data: cmsData } = await supabase.from('page_content').select('content').eq('id', 'home').single();
        if (cmsData) setPageContent(cmsData.content);

        // 2. Songs
        const { data, error } = await supabase.from('songs').select('*').order('view_count', { ascending: false }).limit(12);
        
        if (error) {
            console.error("Supabase Song Error:", error);
            setFetchError(error.message);
            setSongs([]);
            setFilteredSongs([]);
        } else if (data) {
            const safeData = data as unknown as Song[];
            setSongs(safeData);
            setFilteredSongs(safeData);
        }

        // 3. Albums
        const { data: albumData } = await supabase.from('albums').select('*').limit(4);
        if (albumData) setAlbums(albumData as unknown as Album[]);

      } catch (err: unknown) {
        console.error("Data load failed", err);
        if (err instanceof Error) {
            setFetchError(err.message);
        } else {
            setFetchError("Unknown error");
        }
        setSongs([]);
      } finally {
        setIsLoadingSongs(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
      if (difficultyFilter === 'All') {
          setFilteredSongs(songs);
      } else {
          setFilteredSongs(songs.filter(s => s.difficulty === difficultyFilter));
      }
  }, [difficultyFilter, songs]);

  const handleSeed = async () => {
      setIsSeeding(true);
      try {
          const result = await seedDatabase();
          if (result.failed > 0 && result.success === 0) {
              alert("Seeding failed. You might need to Sign In first due to security policies.");
              navigate('/auth');
          } else {
              await fetchData();
          }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
          alert("Seeding error. See console.");
      } finally {
          setIsSeeding(false);
      }
  };


  const heroSubtitle = pageContent?.hero_subtitle || "The most advanced guitar platform for the modern musician. AI-generated chords, immersive tablature, and distraction-free practice modes.";

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex flex-col transition-colors duration-500">
      
      <HomeHero pageContent={pageContent} heroSubtitle={heroSubtitle} />

      <TrendingSection 
        songs={songs}
        isLoading={isLoadingSongs}
        fetchError={fetchError}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        handleSeed={handleSeed}
        isSeeding={isSeeding}
        filteredSongs={filteredSongs}
      />

      <FeaturedAlbums albums={albums} />

      {/* Video Tutorials Section */}
      <div id="tutorials" className="relative z-10 px-6 py-16 max-w-7xl mx-auto w-full mb-10">
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500">Loading Videos...</div>}>
            <VideoGallery />
        </Suspense>
      </div>
    </div>
  );
};

export default Home;
