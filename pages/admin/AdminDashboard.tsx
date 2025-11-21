
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Music, Zap, Database, LogOut, LayoutDashboard, Menu, Sparkles, Save } from 'lucide-react';
import { cn, DOT_GRID_SVG } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import AIChordForm from '../../components/AIChordForm';

// --- Sub-Components ---

const AdminSidebar: React.FC<{ open: boolean, setOpen: (v: boolean) => void }> = ({ open, setOpen }) => {
    const { isSuperAdmin, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
        { icon: <Zap size={20} />, label: 'AI Chord Creator', path: '/admin/ai-create' },
        { icon: <Music size={20} />, label: 'Manual Entry', path: '/admin/manual' },
        // Only show Role Management for Super Admin
        ...(isSuperAdmin ? [{ icon: <Users size={20} />, label: 'Role Management', path: '/admin/roles' }] : []),
        { icon: <Database size={20} />, label: 'Cache/System', path: '/admin/system' },
    ];

    return (
        <div className={cn(
            "fixed left-0 top-0 h-screen bg-slate-900 text-white border-r border-white/10 transition-all duration-300 z-50",
            open ? "w-64" : "w-20"
        )}>
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                </div>
                {open && <span className="font-bold text-lg tracking-tight">Admin<span className="text-primary">Core</span></span>}
            </div>

            <div className="flex flex-col h-[calc(100%-80px)] justify-between p-4">
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/10",
                                location.pathname === item.path ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400"
                            )}
                        >
                            {item.icon}
                            {open && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </div>

                <button 
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className="flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                    <LogOut size={20} />
                    {open && <span className="text-sm font-medium">Exit Console</span>}
                </button>
            </div>
        </div>
    );
};

const RoleManagement: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('role', { ascending: false });
        if (data) setUsers(data as any);
        setLoading(false);
    };

    const updateRole = async (userId: string, newRole: string) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) {
            alert('Failed to update role');
            fetchUsers(); // Revert
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users /> User Role Management</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                                        {u.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{u.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{u.id}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-bold uppercase",
                                        u.role === 'super_admin' ? "bg-purple-500/10 text-purple-500" :
                                        u.role === 'admin' ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                                    )}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {u.id !== currentUser?.id && (
                                        <select 
                                            value={u.role}
                                            onChange={(e) => updateRole(u.id, e.target.value)}
                                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AICreator: React.FC = () => {
    return (
        <div className="p-8 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Zap className="text-yellow-400" /> AI Chord Generator</h2>
            <p className="text-slate-500 mb-8">Use the Gemini 2.5 Neural Engine to generate and save official songs to the database with 100% accuracy (verified by AI).</p>
            <AIChordForm />
        </div>
    );
};

const DashboardOverview: React.FC = () => {
    const stats = [
        { label: 'Total Users', value: '1,240', change: '+12%' },
        { label: 'Total Songs', value: '3,850', change: '+5%' },
        { label: 'AI Requests', value: '854', change: '+22%' },
        { label: 'Server Load', value: '34%', change: '-2%' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Command Center</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl">
                        <p className="text-slate-500 text-sm uppercase font-mono mb-2">{s.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-bold">{s.value}</h3>
                            <span className={cn("text-xs font-bold px-2 py-1 rounded", s.change.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                {s.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {/* Placeholder for more widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="h-64 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400">
                    Traffic Analytics Widget
                 </div>
                 <div className="h-64 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400">
                    Recent Activity Log
                 </div>
            </div>
        </div>
    );
};

const ManualEntry: React.FC = () => {
    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Save /> Manual Song Entry</h2>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10">
                <p className="text-slate-500 text-sm mb-4">Override AI and manually input tablature or JSON chord data.</p>
                {/* Simplified form for demo */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input placeholder="Title" className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10" />
                    <input placeholder="Artist" className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10" />
                </div>
                <textarea placeholder="JSON Data..." className="w-full h-64 p-4 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono text-xs mb-4"></textarea>
                <button className="bg-primary text-white px-4 py-2 rounded-lg">Save to Database</button>
            </div>
        </div>
    );
};

// --- Main Layout ---

const AdminDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex transition-colors duration-500">
             <div 
                className="fixed inset-0 pointer-events-none z-0 opacity-30"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(DOT_GRID_SVG)}')`, backgroundSize: '20px 20px' }}
            />
            
            <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            <div className={cn("flex-1 transition-all duration-300 relative z-10", sidebarOpen ? "ml-64" : "ml-20")}>
                {/* Top Bar */}
                <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center px-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg mr-4">
                        <Menu size={20} />
                    </button>
                    <h1 className="font-bold text-lg">Dashboard</h1>
                </div>

                <Routes>
                    <Route path="/" element={<DashboardOverview />} />
                    <Route path="/roles" element={<RoleManagement />} />
                    <Route path="/ai-create" element={<AICreator />} />
                    <Route path="/manual" element={<ManualEntry />} />
                    <Route path="/system" element={<div className="p-8">System Cache Settings (Coming Soon)</div>} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;
