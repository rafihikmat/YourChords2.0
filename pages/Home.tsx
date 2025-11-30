
import React, { useEffect, useState, Suspense } from 'react';
import { Song } from '../types';
// Lazy load heavy VideoGallery component
const VideoGallery = React.lazy(() => import('../components/VideoGallery').then(module => ({ default: module.VideoGallery })));
import { HomeHero } from '../components/home/HomeHero';
import { TrendingSection } from '../components/home/TrendingSection';
import { FeaturedAlbums } from '../components/home/FeaturedAlbums';

import { useHomeData } from '../lib/hooks/useHomeData';

/**
 * The Home page component (Landing Page).
 * Displays the hero section, trending songs, featured albums, and video tutorials.
 * Handles data fetching, filtering by difficulty, and database seeding.
 *
 * @returns {JSX.Element} The Home page component.
 */
const Home: React.FC = () => {
  const { 
    songs, 
    albums, 
    isLoadingSongs, 
    pageContent, 
    fetchError, 
    handleSeed, 
    isSeeding 
  } = useHomeData();

  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  useEffect(() => {
      if (difficultyFilter === 'All') {
          setFilteredSongs(songs);
      } else {
          setFilteredSongs(songs.filter(s => s.difficulty === difficultyFilter));
      }
  }, [difficultyFilter, songs]);

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
