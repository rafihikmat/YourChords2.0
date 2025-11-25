import React from 'react';

interface SongMetadataFormProps {
    title: string;
    artist: string;
    difficulty: string;
    spotifyId: string;
    youtubeId: string;
    onChange: (field: string, value: string) => void;
}

export const SongMetadataForm: React.FC<SongMetadataFormProps> = ({
    title,
    artist,
    difficulty,
    spotifyId,
    youtubeId,
    onChange
}) => {
    return (
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
                <input
                    required
                    value={title}
                    onChange={e => onChange('title', e.target.value)}
                    placeholder="Song title"
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Artist</label>
                <input
                    required
                    value={artist}
                    onChange={e => onChange('artist', e.target.value)}
                    placeholder="Artist name"
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Difficulty</label>
                <select
                    value={difficulty}
                    onChange={e => onChange('difficulty', e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Expert</option>
                </select>
            </div>
            <div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Spotify Track ID</label>
                        <input
                            value={spotifyId}
                            onChange={e => onChange('spotify_id', e.target.value)}
                            placeholder="Optional"
                            className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">YouTube Video ID</label>
                        <input
                            value={youtubeId}
                            onChange={e => onChange('youtube_id', e.target.value)}
                            placeholder="Optional"
                            className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
