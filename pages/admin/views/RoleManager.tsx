import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Profile } from '../../../types';
import { cn, fuzzySearch } from '../../../lib/utils';
import { Search, Shield, UserCog, AlertCircle } from 'lucide-react';

const RoleManager: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
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
            alert("Security Protocol: You cannot modify your own clearance level.");
            return;
        }
        
        if (!confirm(`Authorize role change to [${newRole.toUpperCase()}] for this user?`)) return;

        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        
        if (error) {
            alert("Operation Failed: " + error.message);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        }
    };

    const filteredUsers = fuzzySearch<Profile>(users, searchQuery, ['full_name', 'id']).filter(u => 
        roleFilter === 'all' ? true : u.role === roleFilter
    );

    return (
        <div className="p-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Access Control</h1>
                    <p className="text-slate-500">Manage user permissions and administrative privileges.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-white/5">
                        <tr>
                            <th className="p-4">User Identity</th>
                            <th className="p-4">Clearance Level</th>
                            <th className="p-4">System ID</th>
                            <th className="p-4 text-right">Override</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading access data...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users match your query.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden shadow-inner">
                                                {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name || 'User'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{u.full_name?.charAt(0) || 'U'}</div>}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">{u.full_name || 'Unknown User'}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
                                            u.role === 'super_admin' ? "border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]" :
                                            u.role === 'admin' ? "border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10" :
                                            "border-slate-500/20 text-slate-600 dark:text-slate-400 bg-slate-500/10"
                                        )}>
                                            {u.role === 'super_admin' ? <Shield className="w-3 h-3" /> : u.role === 'admin' ? <UserCog className="w-3 h-3" /> : null}
                                            {u.role.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {u.id}
                                    </td>
                                    <td className="p-4 text-right">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={u.id === currentUser?.id}
                                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default RoleManager;