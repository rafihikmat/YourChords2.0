import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music, Youtube, Loader2, Disc, Book, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SearchResult } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch, SearchTab } from '../lib/hooks/useSearch';

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
    /** Optional class names for styling the container. */
    className?: string;
    /**
     * The visual variant of the search bar.
     * - 'navbar': Compact version suitable for the navigation bar.
     * - 'full': Expanded version suitable for full-width mobile menus.
     */
    variant?: 'navbar' | 'full';
}

/**
 * A comprehensive search component that queries the local library, Spotify, and YouTube.
 * Features auto-complete, trending suggestions, and categorized results.
 *
 * @param {SearchBarProps} props - The component props.
 * @returns {JSX.Element} The SearchBar component.
 */
const SearchBar: React.FC<SearchBarProps> = ({ className, variant = 'navbar' }) => {
    const {
        query,
        setQuery,
        results,
        setResults,
        suggestions,
        isLoading,
        activeTab,
        setActiveTab
    } = useSearch();

    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showSuggestions = isOpen && query.length === 0 && suggestions.length > 0;
    const showResults = isOpen && query.length > 0;

    return (
        <div ref={searchRef} className={cn("relative z-50", className)}>
            <div className={cn(
                "flex flex-col bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl transition-all focus-within:border-primary/50 focus-within:bg-white focus-within:dark:bg-white/10 focus-within:ring-1 focus-within:ring-primary/50 overflow-hidden",
                variant === 'navbar' ? "w-64 lg:w-96" : "w-full"
            )}>
                <div className="flex items-center px-4 py-2.5">
                    <Search className={cn("text-slate-400 dark:text-neutral-400 mr-3 shrink-0", variant === 'navbar' ? "w-4 h-4" : "w-5 h-5")} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        placeholder={variant === 'navbar' ? "Search artist, song, or tutorial..." : "Search library, Spotify & YouTube..."}
                        className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-500 w-full text-sm"
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); }} className="text-slate-400 hover:text-slate-900 dark:text-neutral-500 dark:hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Tabs are now visible whenever the search bar is Open (focused or has query) */}
                {isOpen && (
                    <div className="flex border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                        {['all', 'songs', 'albums', 'tutorials'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as SearchTab)}
                                className={cn(
                                    "flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors",
                                    activeTab === tab
                                        ? "bg-white dark:bg-white/10 text-primary border-b-2 border-primary"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {(isOpen) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                            "absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]",
                            variant === 'navbar' ? "w-[140%] -left-[20%]" : "w-full"
                        )}
                    >
                        {showSuggestions && (
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-yellow-500" /> Trending & Suggested
                                </div>
                                {suggestions.map((result) => (
                                    <a
                                        key={result.id}
                                        href={result.url}
                                        className="px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{result.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{result.artist}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                        {isLoading && (
                            <div className="p-8 flex flex-col items-center justify-center text-slate-500 dark:text-neutral-400 text-sm gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span>Searching neural database...</span>
                            </div>
                        )}

                        {!isLoading && showResults && (
                            <div className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
                                {results.length > 0 ? (
                                    results.map((result) => (
                                        <a
                                            key={`${result.source}-${result.id}`}
                                            href={result.source === 'library' ? `#${result.url}` : result.url}
                                            target={result.source === 'library' ? '_self' : '_blank'}
                                            rel="noreferrer"
                                            className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors group block border-b border-slate-100 dark:border-white/5 last:border-0"
                                        >
                                            {result.thumbnail ? (
                                                <img src={result.thumbnail} alt={result.title} className="w-10 h-10 rounded object-cover shadow-sm" />
                                            ) : (
                                                <div className={cn(
                                                    "w-10 h-10 rounded flex items-center justify-center",
                                                    result.source === 'library' ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-neutral-400"
                                                )}>
                                                    {result.source === 'library' ? <Book className="w-5 h-5" /> : <Disc className="w-5 h-5" />}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: result.title }}></h4>
                                                <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{result.artist}</p>
                                            </div>
                                            <div className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium",
                                                result.source === 'spotify' ? "text-green-500 bg-green-500/10" :
                                                    result.source === 'youtube' ? "text-red-500 bg-red-500/10" :
                                                        "text-blue-500 bg-blue-500/10"
                                            )}>
                                                {result.source === 'spotify' && <Music className="w-3 h-3" />}
                                                {result.source === 'youtube' && <Youtube className="w-3 h-3" />}
                                                {result.source === 'library' && <Book className="w-3 h-3" />}
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">No matches found</p>
                                        <p className="text-xs text-slate-500 mt-1">Try broader keywords or check your spelling.</p>
                                    </div>
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
