import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Music, Zap, LogOut, LayoutDashboard, Disc, RefreshCw, ExternalLink, Home, Plus, Save, Trash2, Edit, Search, Check, AlertTriangle, Globe, HardDrive, Layers, Mic, RotateCcw, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile, Song, Album, VideoTutorial } from '../../types';
import AIChordForm from '../../components/AIChordForm';
import SmartSyncEditor from './SmartSyncEditor';

// --- Helper: Chord Parser for Manual Entry ---
const parseChordsFromText = (text: string) => {
    const lines = text.split('\n');
    const jsonOutput = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimEnd();
        if (!line) continue;

        // Detect section headers [Chorus], [Verse]
        if (line.startsWith('[') && line.endsWith(']')) {
             jsonOutput.push({ line: line, chords: [] });
             continue;
        }
        jsonOutput.push({ line: line, chords: [] });
    }
    return jsonOutput;
};

const AdminSidebar: React.FC<{ open: boolean }> = ({ open }) => {
    const { isSuperAdmin, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin', permission: 'admin' },
        { icon: <Mic size={20} />, label: 'Smart Sync', path: '/admin/smart-sync', permission: 'admin' },
        { icon: <Globe size={20} />, label: 'Page Content', path: '/admin/cms', permission: 'admin' },
        { icon: <Music size={20} />, label: 'Song Manager', path: '/admin/songs', permission: 'admin' },
        { icon: <Disc size={20} />, label: 'Asset Manager', path: '/admin/assets', permission: 'admin' },
        { icon: <Zap size={20} />, label: 'AI Generator', path: '/admin/ai-create', permission: 'admin' },
        { icon: <RefreshCw size={20} />, label: 'System Maint.', path: '/admin/cache', permission: 'super_admin' },
        { icon: <Users size={20} />, label: 'Role Management', path: '/admin/roles', permission: 'super_admin' },
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.permission === 'super_admin') return isSuperAdmin;
        return true;
    });

    return (
        <div className={cn(
            "fixed left-0 top-0 h-screen border-r transition-all duration-300 z-50 flex flex-col bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10",
            open ? "w-64" : "w-20"
        )}>
            <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-white/10 h-20">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", isSuperAdmin ? "bg-purple-600" : "bg-blue-600")}>
                    <Shield className="w-5 h-5 text-white" />
                </div>
                {open && (
                    <div className="leading-tight overflow-hidden whitespace-nowrap">
                         <span className="font-bold text-lg tracking-tight block text-slate-900 dark:text-white">Admin<span className={isSuperAdmin ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}>Core</span></span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1 px-3 custom-scrollbar">
                 <Link
                    to="/"
                    className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all mb-6 group",
                        "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                    )}
                >
                    <Home size={20} />
                    {open && <span className="text-sm font-medium">Return Home</span>}
                </Link>

                {filteredItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all relative overflow-hidden",
                            location.pathname === item.path 
                                ? (isSuperAdmin ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25" : "bg-blue-600 text-white shadow-lg shadow-blue-500/25")
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                        )}
                    >
                        {item.icon}
                        {open && <span className="text-sm font-medium">{item.label}</span>}
                        {location.pathname === item.path && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>
                        )}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10">
                <button 
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className="flex items-center gap-3 p-3 w-full rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-all"
                >
                    <LogOut size={20} />
                    {open && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>
        </div>
    );
};

// --- Role Management ---
const RoleManager: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) alert('Error fetching users: ' + error.message);
        else setUsers(data as Profile[]);
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === currentUser?.id) {
            alert("You cannot change your own role.");
            return;
        }
        
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        
        if (error) {
            alert("Failed to update role: " + error.message);
        } else {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        }
    };

    return (
        <div className="p-8 animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Role Management</h1>
                <p className="text-slate-500">Manage user permissions and access levels.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">ID</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading profiles...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                                                {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name || 'User'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{u.full_name?.charAt(0) || 'U'}</div>}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">{u.full_name || 'Unknown User'}</div>
                                                <div className="text-xs text-slate-500">Joined {u.id.slice(0,8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold border uppercase",
                                            u.role === 'super_admin' ? "border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/10" :
                                            u.role === 'admin' ? "border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10" :
                                            "border-slate-500/20 text-slate-600 dark:text-slate-400 bg-slate-500/10"
                                        )}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {u.id}
                                    </td>
                                    <td className="p-4 text-right">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={u.id === currentUser?.id}
                                            className="bg-slate-100 dark:bg-slate-800 border-none text-xs rounded-lg p-2 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- CMS Component ---
const ContentManager: React.FC = () => {
    const [pages, setPages] = useState<{id: string, content: any}[]>([]);
    const [selectedPage, setSelectedPage] = useState<string>('home');
    const [editContent, setEditContent] = useState<string>('');
    const [isValidJson, setIsValidJson] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        const { data } = await supabase.from('page_content').select('*');
        if (data) {
            setPages(data);
            const current = data.find(p => p.id === selectedPage);
            if (current) setEditContent(JSON.stringify(current.content, null, 2));
        }
    };

    const validateJson = (val: string) => {
        try {
            JSON.parse(val);
            setIsValidJson(true);
        } catch (e) {
            setIsValidJson(false);
        }
    };

    const handleSave = async () => {
        try {
            const json = JSON.parse(editContent);
            const { error } = await supabase
                .from('page_content')
                .upsert({ id: selectedPage, content: json, updated_at: new Date().toISOString() });
            
            if (error) throw error;
            alert('Content updated successfully! Changes are live.');
            fetchContent();
        } catch (e: any) {
            alert('Error saving: ' + e.message);
        }
    };

    return (
        <div className="p-8 animate-in fade-in">
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management System</h1>
                <p className="text-slate-500">Edit text and settings for public pages.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[500px] shadow-sm">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-white/10 p-4">
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-4">Pages</h3>
                    <div className="space-y-2">
                        {['home', 'about'].map(page => (
                            <button 
                                key={page}
                                onClick={() => {
                                    setSelectedPage(page);
                                    const p = pages.find(x => x.id === page);
                                    setEditContent(p ? JSON.stringify(p.content, null, 2) : '{}');
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-2 rounded-lg text-sm font-medium capitalize",
                                    selectedPage === page ? "bg-white dark:bg-slate-800 text-primary shadow border border-slate-200 dark:border-transparent" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-mono text-slate-500">Editing: <span className="text-primary font-bold uppercase">{selectedPage}</span></div>
                        <button 
                            onClick={handleSave} 
                            disabled={!isValidJson}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                    <textarea 
                        value={editContent}
                        onChange={e => {
                            setEditContent(e.target.value);
                            validateJson(e.target.value);
                        }}
                        className={cn(
                            "flex-1 w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-green-400 font-mono text-sm p-4 rounded-xl border focus:ring-1 focus:ring-primary outline-none resize-none shadow-inner",
                            isValidJson ? "border-slate-200 dark:border-slate-800 focus:border-primary" : "border-red-500 focus:border-red-500 text-red-500 dark:text-red-400"
                        )}
                        spellCheck={false}
                    />
                    <div className="flex justify-between items-center mt-2">
                         <p className="text-xs text-slate-500">
                            * Edit the JSON values directly. Use strict JSON format.
                        </p>
                        {!isValidJson && <span className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Invalid JSON</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- System Maintenance ---
const MaintenanceConsole: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleOrphanCleanup = async () => {
        if (!confirm("This will delete files from storage that are not linked to any song in the database. Continue?")) return;
        setLoading(true);
        setStatus('Scanning for orphaned files...');
        try {
            // 1. Get all songs with file_path
            const { data: songs } = await supabase.from('songs').select('file_path');
            const activeFiles = new Set(songs?.map(s => s.file_path).filter(Boolean));

            // 2. List all files in storage
            const { data: files, error } = await supabase.storage.from('song-files').list();
            
            if (error) throw error;

            if (files) {
                const orphans = files.filter(f => f.name !== '.emptyFolderPlaceholder' && !activeFiles.has(f.name));
                if (orphans.length > 0) {
                    setStatus(`Found ${orphans.length} orphaned files. Deleting...`);
                    const pathsToRemove = orphans.map(o => o.name);
                    await supabase.storage.from('song-files').remove(pathsToRemove);
                    setStatus(`Successfully deleted ${orphans.length} orphaned files.`);
                } else {
                    setStatus('System Clean. No orphaned files found.');
                }
            }
        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
        setLoading(false);
    };

    const handleAutoAlbum = async () => {
        if (!confirm("This will group songs by artist and create albums automatically. Continue?")) return;
        setLoading(true);
        setStatus('Analyzing song database for album clusters...');
        try {
             // 1. Fetch all songs
             const { data: songs } = await supabase.from('songs').select('id, artist, album_id');
             if (!songs) throw new Error("No songs found");

             // 2. Group by Artist
             const artistMap: Record<string, Song[]> = {};
             songs.forEach((s: any) => {
                 // Normalize artist name to avoid case sensitivity issues
                 const key = s.artist.trim();
                 if (!artistMap[key]) artistMap[key] = [];
                 artistMap[key].push(s);
             });

             let albumsCreated = 0;

             // 3. Check groups
             for (const artist in artistMap) {
                 const artistSongs = artistMap[artist];
                 
                 // Only process if artist has > 1 song
                 if (artistSongs.length > 1) {
                     // Check if ANY of the songs already belong to an album
                     const hasAlbum = artistSongs.some(s => s.album_id);
                     
                     if (!hasAlbum) {
                         // Create Album
                         const albumTitle = `${artist} Essentials`;
                         const { data: newAlbum, error: albumError } = await supabase.from('albums').insert([{
                             title: albumTitle,
                             artist: artist,
                             cover_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(albumTitle)}&background=random&size=512`
                         }]).select().single();

                         if (newAlbum) {
                             // Update Songs to link to new album
                             const songIds = artistSongs.map(s => s.id);
                             await supabase.from('songs').update({ album_id: newAlbum.id }).in('id', songIds);
                             albumsCreated++;
                         }
                     }
                 }
             }
             setStatus(`Maintenance Complete: Created ${albumsCreated} new albums from existing artist clusters.`);

        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Maintenance</h1>
                <p className="text-slate-500">Database optimization and storage cleanup tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Storage Cleaner */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-orange-500">
                        <HardDrive className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Storage Garbage Collector</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Scans the 'song-files' bucket for files that are no longer linked to any song in the database and permanently deletes them.
                    </p>
                    <button 
                        onClick={handleOrphanCleanup}
                        disabled={loading}
                        className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Run Cleanup
                    </button>
                </div>

                {/* Auto Album */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <Layers className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Smart Album Clustering</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Analyzes the song database. If an artist has multiple songs (&gt;1), this tool automatically creates an album and links them.
                    </p>
                    <button 
                         onClick={handleAutoAlbum}
                         disabled={loading}
                         className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors text-sm font-bold"
                    >
                        Generate Albums
                    </button>
                </div>
            </div>

            {/* Console Output */}
            <div className="mt-8 bg-black rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto border border-white/10 shadow-inner">
                <div className="mb-2 opacity-50">admin@yourchords:~$ ready...</div>
                {loading && <div className="mb-2 animate-pulse text-yellow-400">Processing...</div>}
                {status && <div className="mb-2">{status}</div>}
            </div>
        </div>
    );
};

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
                    <div key={i} className={cn("p-6 rounded-2xl border backdrop-blur-sm bg-white dark:bg-slate-900", s.border)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2 rounded-lg", s.bg, s.color)}>
                                <s.icon size={24} />
                            </div>
                        </div>
                        <div className="space-y-1">
                             <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
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

const SongManager: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        setLoading(true);
        const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
        if (data) setSongs(data as any);
        setLoading(false);
    };

    const handleDelete = async (id: string, filePath?: string | null) => {
        if (confirm('WARNING: Are you sure you want to PERMANENTLY delete this song? This action cannot be undone.')) {
            try {
                // 1. If file exists, delete from storage
                if (filePath) {
                   const { error: storageError } = await supabase.storage.from('song-files').remove([filePath]);
                   if (storageError) console.error("File delete warning:", storageError);
                }

                // 2. Delete record
                const { error } = await supabase.from('songs').delete().eq('id', id);
                if (error) {
                    alert("Error deleting song: " + error.message);
                } else {
                    fetchSongs(); // Refresh list
                }
            } catch (e: any) {
                alert("System Error: " + e.message);
            }
        }
    };
    
    const handleEdit = (song: Song) => {
        navigate('/admin/manual-entry', { state: { songToEdit: song } });
    };

    const filteredSongs = songs.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Song Manager</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search songs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Artist</th>
                            <th className="p-4">Difficulty</th>
                            <th className="p-4">Views</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : filteredSongs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">No songs found.</td></tr>
                        ) : (
                            filteredSongs.map(song => (
                                <tr key={song.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                                        {song.title}
                                        {song.file_path && <span className="ml-2 text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">FILE</span>}
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400">{song.artist}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold border",
                                            song.difficulty === 'Easy' ? "border-green-500/20 text-green-600 dark:text-green-500 bg-green-500/10" :
                                            song.difficulty === 'Medium' ? "border-yellow-500/20 text-yellow-600 dark:text-yellow-500 bg-yellow-500/10" :
                                            song.difficulty === 'Hard' ? "border-orange-500/20 text-orange-600 dark:text-orange-500 bg-orange-500/10" :
                                            "border-red-500/20 text-red-600 dark:text-red-500 bg-red-500/10"
                                        )}>{song.difficulty}</span>
                                    </td>
                                    <td className="p-4 text-slate-500">{song.view_count}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <Link to={`/song/${song.id}`} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded" title="View"><ExternalLink className="w-4 h-4" /></Link>
                                        <button onClick={() => handleEdit(song)} className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(song.id, song.file_path)} className="p-2 hover:bg-red-500/10 text-red-500 rounded" title="Delete Permanently"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AssetManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');
    const [albums, setAlbums] = useState<Album[]>([]);
    const [newAlbum, setNewAlbum] = useState({ title: '', artist: '', cover_url: '' });
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    const [newVideo, setNewVideo] = useState({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });

    useEffect(() => {
        fetchAlbums();
        fetchVideos();
    }, []);

    const fetchAlbums = async () => {
        const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
        if (data) setAlbums(data as any);
    };

    const fetchVideos = async () => {
         const { data } = await supabase.from('video_tutorials').select('*');
         if (data && data.length > 0) setVideos(data as any);
    };

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('albums').insert([newAlbum]);
        if (!error) {
            setNewAlbum({ title: '', artist: '', cover_url: '' });
            fetchAlbums();
        } else {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteAlbum = async (id: string) => {
        if (confirm("Permanently delete this album? This will not delete the songs, but unlink them.")) {
            await supabase.from('albums').delete().eq('id', id);
            fetchAlbums();
        }
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('video_tutorials').insert([newVideo]);
        if (!error) {
            setNewVideo({ video_id: '', title: '', channel_title: '', thumbnail_url: '' });
            fetchVideos();
            alert('Video tutorial added.');
        } else {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (confirm("Permanently delete this video?")) {
            await supabase.from('video_tutorials').delete().eq('video_id', id);
            fetchVideos();
        }
    };

    const handleUpdateVideoTitle = async (id: string, newTitle: string) => {
        setVideos(videos.map(v => v.video_id === id ? { ...v, title: newTitle } : v));
        await supabase.from('video_tutorials').update({ title: newTitle }).eq('video_id', id);
    };

    return (
        <div className="p-8 animate-in fade-in">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Asset Management</h1>
                    <p className="text-slate-500">Manage albums and video tutorials.</p>
                </div>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-transparent">
                    <button 
                        onClick={() => setActiveTab('albums')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'albums' ? "bg-slate-100 dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500")}
                    >
                        Albums
                    </button>
                    <button 
                        onClick={() => setActiveTab('videos')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'videos' ? "bg-slate-100 dark:bg-slate-700 shadow text-primary dark:text-white" : "text-slate-500")}
                    >
                        Tutorials
                    </button>
                </div>
             </div>

             {activeTab === 'albums' && (
                 <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-4 h-4" /> Add New Album</h3>
                        <form onSubmit={handleCreateAlbum} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Title</label>
                                <input required value={newAlbum.title} onChange={e => setNewAlbum({...newAlbum, title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Album Name" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Artist</label>
                                <input required value={newAlbum.artist} onChange={e => setNewAlbum({...newAlbum, artist: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Artist Name" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Cover URL</label>
                                <input required value={newAlbum.cover_url} onChange={e => setNewAlbum({...newAlbum, cover_url: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="https://..." />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20">Create</button>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {albums.map(album => (
                            <div key={album.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-sm">
                                <div className="aspect-square bg-slate-200 dark:bg-slate-800">
                                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{album.title}</h4>
                                    <p className="text-xs text-slate-500 truncate">{album.artist}</p>
                                </div>
                                <button className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md" onClick={() => handleDeleteAlbum(album.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {activeTab === 'videos' && (
                 <div className="space-y-8">
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-4 h-4" /> Add Tutorial Video</h3>
                        <form onSubmit={handleAddVideo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input placeholder="YouTube Video ID (e.g. d_UVn7Z_sZ8)" value={newVideo.video_id} onChange={e => setNewVideo({...newVideo, video_id: e.target.value})} className="p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" required />
                             <input placeholder="Custom Title (Optimized for Search)" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" required />
                             <input placeholder="Channel Name" value={newVideo.channel_title} onChange={e => setNewVideo({...newVideo, channel_title: e.target.value})} className="p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" required />
                             <input placeholder="Thumbnail URL" value={newVideo.thumbnail_url} onChange={e => setNewVideo({...newVideo, thumbnail_url: e.target.value})} className="p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" required />
                             <div className="md:col-span-2">
                                <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-bold w-full shadow-lg shadow-red-500/20">Add Video</button>
                             </div>
                        </form>
                     </div>

                     <div className="space-y-4">
                         {videos.map((video, idx) => (
                             <div key={idx} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                 <img src={video.thumbnail_url} alt="thumb" className="w-32 h-20 object-cover rounded-lg bg-slate-200" />
                                 <div className="flex-1">
                                     <label className="text-xs text-slate-500 uppercase font-bold">Editable Title</label>
                                     <div className="flex gap-2 items-center">
                                         <input 
                                            value={video.title} 
                                            onChange={(e) => handleUpdateVideoTitle(video.video_id, e.target.value)} 
                                            className="flex-1 bg-transparent border-b border-slate-300 dark:border-white/10 focus:border-primary outline-none font-bold text-slate-900 dark:text-white p-1"
                                         />
                                         <Save className="w-4 h-4 text-slate-400 cursor-pointer hover:text-primary" />
                                     </div>
                                     <p className="text-xs text-slate-500 mt-1">ID: {video.video_id} • {video.channel_title}</p>
                                 </div>
                                 <button 
                                    onClick={() => handleDeleteVideo(video.video_id)}
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
};

const ManualEntry: React.FC = () => {
    const location = useLocation();
    const state = location.state as { songToEdit?: Song } | null;
    const [formData, setFormData] = useState({
        id: '', // Used for editing
        title: '',
        artist: '',
        difficulty: 'Medium',
        spotify_url: '',
        youtube_url: '',
        rawText: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Pre-fill if editing
        if (state?.songToEdit) {
            const s = state.songToEdit;
            let raw = '';
            if (s.chords) {
                raw = s.chords.map((line: any) => {
                    // Very basic reconstruction
                    if (line.line.startsWith('[')) return `\n${line.line}\n`;
                    return `${line.line}`;
                }).join('\n');
            }

            setFormData({
                id: s.id,
                title: s.title,
                artist: s.artist,
                difficulty: s.difficulty,
                spotify_url: s.spotify_track_id ? `https://open.spotify.com/track/${s.spotify_track_id}` : '',
                youtube_url: s.youtube_video_id ? `https://www.youtube.com/watch?v=${s.youtube_video_id}` : '',
                rawText: raw || ''
            });
        }
    }, [state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const parsedChords = parseChordsFromText(formData.rawText);

        // Extract IDs from URLs
        const spotifyId = formData.spotify_url.split('track/')[1]?.split('?')[0] || null;
        const youtubeId = formData.youtube_url.split('v=')[1]?.split('&')[0] || null;

        const payload = {
            title: formData.title,
            artist: formData.artist,
            difficulty: formData.difficulty,
            spotify_track_id: spotifyId,
            youtube_video_id: youtubeId,
            chords: parsedChords,
        };

        let error;
        
        if (formData.id) {
            // Update existing
            const { error: updateError } = await supabase.from('songs').update(payload).eq('id', formData.id);
            error = updateError;
        } else {
            // Insert new
            const { error: insertError } = await supabase.from('songs').insert([{ ...payload, view_count: 0 }]);
            error = insertError;
        }

        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else {
            alert(formData.id ? 'Song updated!' : 'Song added successfully!');
            if (!formData.id) setFormData({ id: '', title: '', artist: '', difficulty: 'Medium', spotify_url: '', youtube_url: '', rawText: '' });
        }
    };

    return (
        <div className="p-8 animate-in fade-in">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{formData.id ? 'Edit Song' : 'Manual Song Entry'}</h1>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white">Metadata</h3>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
                            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Artist</label>
                            <input required value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Difficulty</label>
                            <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                                <option>Expert</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Spotify URL</label>
                             <input value={formData.spotify_url} onChange={e => setFormData({...formData, spotify_url: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="https://open.spotify.com/..." />
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase text-slate-500 mb-1">YouTube URL</label>
                             <input value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})} className="w-full p-2 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="https://youtube.com/..." />
                        </div>
                     </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 h-full flex flex-col shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Lyrics & Chords</h3>
                        <p className="text-xs text-slate-500 mb-4">Enter lyrics line by line. Use [Chorus] for headers.</p>
                        <textarea 
                            required 
                            value={formData.rawText} 
                            onChange={e => setFormData({...formData, rawText: e.target.value})} 
                            className="flex-1 w-full p-4 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 font-mono text-sm text-slate-900 dark:text-slate-300 min-h-[400px]" 
                            placeholder="[Verse 1]&#10;I'm walking down the street..."
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                        <Save className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Song'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
     // Sync initial state
     setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
          html.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          setIsDark(false);
      } else {
          html.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          setIsDark(true);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <AdminSidebar open={sidebarOpen} />
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
        <header className="h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400">
                    <LayoutDashboard className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">Admin Console v2.0</span>
           </div>

           <div className="flex items-center gap-3">
               <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
               >
                   {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">
                   A
               </div>
           </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
            <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="cms" element={<ContentManager />} />
                <Route path="songs" element={<SongManager />} />
                <Route path="manual-entry" element={<ManualEntry />} />
                <Route path="smart-sync" element={<SmartSyncEditor />} />
                <Route path="assets" element={<AssetManager />} />
                <Route path="ai-create" element={<div className="p-8"><h2 className="text-2xl font-bold mb-6">AI Song Generator</h2><AIChordForm /></div>} />
                <Route path="cache" element={<MaintenanceConsole />} />
                <Route path="roles" element={<RoleManager />} />
            </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;