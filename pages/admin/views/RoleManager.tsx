import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Profile } from '../../../types';
import { cn } from '../../../lib/utils';
import { Search, Shield, UserCog, Trash2, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { SearchFilterBar } from '../../../components/admin/SearchFilterBar';

const ITEMS_PER_PAGE = 20;

const RoleManager: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const { user: currentUser, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const { toast, success, error: toastError } = useToast();

    useEffect(() => {
        if (!isSuperAdmin) {
            navigate('/admin');
        }
    }, [isSuperAdmin, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' });

            // Filters
            if (searchQuery) {
                // Note: searching by ID or full_name
                query = query.or(`full_name.ilike.%${searchQuery}%,id.eq.${searchQuery}`);
            }
            if (roleFilter !== 'all') {
                query = query.eq('role', roleFilter);
            }

            // Pagination
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setUsers(data as Profile[]);
            setTotalCount(count || 0);
        } catch (err: any) {
            toastError('Error fetching users: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, roleFilter, toastError]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, roleFilter]);

    const handleRoleChange = async (targetId: string, newRole: string) => {
        if (!isSuperAdmin) {
            toastError("Security Protocol: Only Super Admins can modify clearance levels.");
            return;
        }

        if (targetId === currentUser?.id) {
            toastError("Security Protocol: You cannot modify your own clearance level.");
            return;
        }

        if (!['user', 'admin', 'super_admin'].includes(newRole)) {
            toastError("Invalid Role Assignment.");
            return;
        }
        
        if (!confirm(`Authorize role change to [${newRole.toUpperCase()}] for this user?`)) return;

        try {
            const { error } = await supabase.functions.invoke('admin-actions', {
                body: { 
                    action: 'UPDATE_ROLE',
                    targetUserId: targetId,
                    newRole: newRole
                }
            });

            if (error) throw error;

            // Optimistic update
            setUsers(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole as Profile['role'] } : u));
            success(`User role updated to ${newRole.toUpperCase()}.`);

        } catch (err: any) {
            toastError("Role Update Failed: " + (err.message || "Unknown error"));
        }
    };

    const handleDeleteUser = async (targetId: string, targetName: string) => {
        if (!isSuperAdmin) return;
        
        if (targetId === currentUser?.id) {
            toastError("Security Protocol: Self-termination is not permitted.");
            return;
        }

        if (!confirm(`WARNING: Are you sure you want to PERMANENTLY DELETE user "${targetName}"?`)) return;

        try {
            const { error } = await supabase.functions.invoke('admin-actions', {
                body: { 
                    action: 'DELETE_USER',
                    targetUserId: targetId 
                }
            });

            if (error) throw error;

            setUsers(prev => prev.filter(u => u.id !== targetId));
            success(`User "${targetName}" has been terminated.`);
        } catch (err: any) {
            toastError("Deletion Failed: " + (err.message || "Unknown error"));
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Access Control</h1>
                    <p className="text-slate-500 mt-1">Manage user permissions and administrative privileges.</p>
                </div>
                
                <SearchFilterBar 
                    searchTerm={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search users..."
                    filters={[
                        {
                            value: roleFilter,
                            onChange: setRoleFilter,
                            options: [
                                { label: 'All Roles', value: 'all' },
                                { label: 'Super Admin', value: 'super_admin' },
                                { label: 'Admin', value: 'admin' },
                                { label: 'User', value: 'user' },
                            ]
                        }
                    ]}
                />
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-black/20 flex flex-col min-h-[600px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200/60 dark:border-white/5">
                            <tr>
                                <th className="p-5 pl-6">User Identity</th>
                                <th className="p-5">Clearance Level</th>
                                <th className="p-5">System ID</th>
                                <th className="p-5 text-right pr-6">Override</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                                            <span>Loading access data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-8 h-8 opacity-20" />
                                            <span>No users match your query.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-5 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden shadow-inner ring-2 ring-white dark:ring-slate-800">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt={u.full_name || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                                            {u.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{u.full_name || 'Unknown User'}</div>
                                                    <div className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Active
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide shadow-sm",
                                                u.role === 'super_admin' ? "border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/10 shadow-purple-500/10" :
                                                u.role === 'admin' ? "border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10 shadow-blue-500/10" :
                                                "border-slate-500/20 text-slate-600 dark:text-slate-400 bg-slate-500/10"
                                            )}>
                                                {u.role === 'super_admin' ? <Shield className="w-3 h-3" /> : u.role === 'admin' ? <UserCog className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                {u.role.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="p-5 text-xs text-slate-500 font-mono">
                                            <span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/5">
                                                {u.id}
                                            </span>
                                        </td>
                                        <td className="p-5 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <select 
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    disabled={u.id === currentUser?.id || !isSuperAdmin}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                                
                                                {isSuperAdmin && u.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.full_name || 'User')}
                                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                    <div className="text-xs text-slate-500">
                        Showing <span className="font-bold">{users.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleManager;
