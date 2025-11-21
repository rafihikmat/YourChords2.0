import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music, Youtube, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SearchResult } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  className?: string;
  variant?: 'navbar' | 'full';
}

const SearchBar: React.FC<SearchBarProps> = ({ className, variant = 'navbar' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);
      
      try {
        // Parallel execution of searches
        const [spotifyPromise, youtubePromise] = await Promise.allSettled([
             supabase.functions.invoke('search-spotify', { body: { query } }),
             supabase.functions.invoke('search-youtube', { body: { query } })
        ]);

        const newResults: SearchResult[] = [];

        // Process Spotify Results
        if (spotifyPromise.status === 'fulfilled' && spotifyPromise.value.data) {
            const sData = spotifyPromise.value.data;
            if (sData.tracks?.items) {
                newResults.push(...sData.tracks.items.slice(0, 3).map((item: any) => ({
                    id: item.id,
                    title: item.name,
                    artist: item.artists[0].name,
                    thumbnail: item.album.images[2]?.url,
                    source: 'spotify',
                    url: item.external_urls?.spotify
                })));
            }
        }

        // Process YouTube Results
        if (youtubePromise.status === 'fulfilled' && youtubePromise.value.data) {
            const yData = youtubePromise.value.data;
            if (yData.items) {
                newResults.push(...yData.items.slice(0, 3).map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails.default?.url,
                    source: 'youtube',
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                })));
            }
        }

        setResults(newResults);

      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div ref={searchRef} className={cn("relative z-50", className)}>
      <div className={cn(
        "flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full transition-all focus-within:border-primary/50 focus-within:bg-white focus-within:dark:bg-white/10 focus-within:ring-1 focus-within:ring-primary/50",
        variant === 'navbar' ? "w-64 lg:w-96 px-4 py-2" : "w-full px-6 py-4 text-lg"
      )}>
        <Search className={cn("text-slate-400 dark:text-neutral-400 mr-3", variant === 'navbar' ? "w-4 h-4" : "w-5 h-5")} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder="Search Spotify & YouTube..."
          className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-500 w-full"
        />
        {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="text-slate-400 hover:text-slate-900 dark:text-neutral-500 dark:hover:text-white">
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
                "absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]",
                variant === 'navbar' ? "w-[120%]" : "w-full"
            )}
          >
            {isLoading ? (
                <div className="p-4 flex items-center justify-center text-slate-500 dark:text-neutral-400 text-sm gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching multiverse...
                </div>
            ) : (
                <div className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {results.map((result) => (
                        <div key={`${result.source}-${result.id}`} className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors group">
                            {result.thumbnail ? (
                                <img src={result.thumbnail} alt={result.title} className="w-10 h-10 rounded object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-slate-500 dark:text-neutral-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{__html: result.title}}></h4>
                                <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{result.artist}</p>
                            </div>
                            <div className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                result.source === 'spotify' ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                            )}>
                                {result.source === 'spotify' ? <Music className="w-3 h-3" /> : <Youtube className="w-3 h-3" />}
                            </div>
                        </div>
                    ))}
                    {results.length === 0 && !isLoading && (
                        <div className="p-4 text-center text-slate-500 dark:text-neutral-500 text-sm">No results found via Neural Link.</div>
                    )}
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;