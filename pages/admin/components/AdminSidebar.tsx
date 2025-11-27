
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Globe, Music, Edit, Disc, Zap, RefreshCw, Users, Home, LogOut, PlayCircle, KeyRound } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Sidebar navigation component for the Admin Dashboard.
 * Displays different menu items based on user roles (Admin vs. Super Admin).
 * Handles navigation, active state styling, and logout.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.open - Whether the sidebar is expanded or collapsed.
 * @returns {JSX.Element} The AdminSidebar component.
 */
export const AdminSidebar: React.FC<{ open: boolean }> = ({ open }) => {
    const { isSuperAdmin, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin', permission: 'admin' },
        { icon: <Globe size={20} />, label: 'Page Content', path: '/admin/cms', permission: 'admin' },
        { icon: <Music size={20} />, label: 'Song Manager', path: '/admin/songs', permission: 'admin' },
        { icon: <Edit size={20} />, label: 'Manual Entry', path: '/admin/manual-entry', permission: 'admin' },

        { icon: <Disc size={20} />, label: 'Asset Manager', path: '/admin/assets', permission: 'admin' },
        { icon: <KeyRound size={20} />, label: 'Password Requests', path: '/admin/password-requests', permission: 'admin' },
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
            "fixed left-0 top-0 h-screen border-r transition-all duration-300 z-50 flex flex-col bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 no-print",
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
