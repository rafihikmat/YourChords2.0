
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import { useAuth } from '../contexts/AuthContext';
import SongCard from '../components/ui/SongCard';
import { Heart, Loader2 } from 'lucide-react';
import { DOT_GRID_SVG } from '../lib/utils';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      // Join query to get song details from favorites table
      const { data, error } = await supabase
        .from('song_favorites')
        .select('song_id, songs (*)')
        .eq('user_id', user.id);

      if (!error && data) {
        // Extract the song object from the join result
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const favoritedSongs = data.map((item: any) => item.songs).filter(Boolean);
        setSongs(favoritedSongs);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Loading Favorites...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative">
       <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-pink-500/10 rounded-2xl">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Collection</h1>
                <p className="text-slate-500 dark:text-slate-400">Songs you've saved for later practice.</p>
            </div>
        </div>

        {songs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.map(song => (
                    <SongCard key={song.id} song={song} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10 backdrop-blur-sm">
                <Heart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No favorites yet</h3>
                <p className="text-slate-500 dark:text-slate-400">Start exploring the library and tap the heart icon to save songs.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
