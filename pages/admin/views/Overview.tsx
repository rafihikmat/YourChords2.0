
import React, { useState, useEffect } from 'react';
import { Users, Music, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';

const Overview: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, songs: 0, ratings: 0, views: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
            const { count: ratingCount } = await supabase.from('song_ratings').select('*', { count: 'exact', head: true });
            
            const { data: viewData } = await supabase.from('songs').select('view_count');
            const totalViews = viewData?.reduce((acc, curr) => acc + (curr.view_count || 0), 0) || 0;

            setStats({
                users: userCount || 0,
                songs: songCount || 0,
                ratings: ratingCount || 0,
                views: totalViews
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Overview</h1>
                <p className="text-slate-500">Real-time performance metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Song Database', value: stats.songs, icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { label: 'Total Ratings', value: stats.ratings, icon: Check, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                    { label: 'Total Views', value: stats.views.toLocaleString(), icon: ExternalLink, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                ].map((s, i) => (
                    <div key={i} className={cn(
                        "p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                        "bg-white/60 dark:bg-slate-900/60",
                        s.border
                    )}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl shadow-sm", s.bg, s.color)}>
                                <s.icon size={24} />
                            </div>
                        </div>
                        <div className="space-y-1">
                             <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {loading ? <span className="animate-pulse opacity-50">...</span> : s.value}
                             </h3>
                             <p className="text-xs uppercase font-bold tracking-wider opacity-60 dark:text-white text-slate-900">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Overview;
