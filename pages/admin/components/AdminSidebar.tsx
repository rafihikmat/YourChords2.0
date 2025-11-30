import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Globe, Music, Edit, Disc, Zap, RefreshCw, Users, Home, LogOut } from 'lucide-react';
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
            "fixed left-0 top-0 h-screen border-r transition-all duration-500 ease-out z-50 flex flex-col no-print backdrop-blur-xl",
            "bg-white/95 dark:bg-slate-950/90 border-slate-300 dark:border-slate-800",
            open ? "w-72" : "w-20"
        )}>
            {/* Header / Logo Area */}
            <div className="p-6 flex items-center gap-4 h-24 mb-2">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500",
                    isSuperAdmin 
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/30" 
                        : "bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-500/30",
                    open ? "rotate-0" : "rotate-3"
                )}>
                    <Shield className="w-5 h-5 text-white" />
                </div>
                
                <div className={cn(
                    "leading-tight overflow-hidden whitespace-nowrap transition-all duration-500",
                    open ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                )}>
                    <span className="font-bold text-xl tracking-tight block text-slate-900 dark:text-white">
                        Admin
                        <span className={cn(
                            "bg-clip-text text-transparent bg-gradient-to-r",
                            isSuperAdmin ? "from-purple-600 to-indigo-500" : "from-blue-600 to-cyan-500"
                        )}>
                            Core
                        </span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        v2.0 Control Panel
                    </span>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 px-4 custom-scrollbar">
                <Link
                    to="/"
                    className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                        "hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                >
                    <Home size={20} className="transition-transform duration-300 group-hover:scale-110" />
                    <span className={cn(
                        "text-sm font-medium transition-all duration-300",
                        open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute left-14"
                    )}>
                        Return Home
                    </span>
                </Link>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent my-4 opacity-50" />

                {filteredItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden",
                                isActive
                                    ? (isSuperAdmin 
                                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25" 
                                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25")
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <div className={cn("relative z-10 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
                                {item.icon}
                            </div>
                            
                            <span className={cn(
                                "text-sm font-medium relative z-10 transition-all duration-300",
                                open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute left-14"
                            )}>
                                {item.label}
                            </span>

                            {/* Active State Glow Effect */}
                            {isActive && (
                                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 mt-2 border-t border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                <button
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className={cn(
                        "flex items-center gap-3 p-3.5 w-full rounded-xl transition-all duration-300 group",
                        "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                    )}
                >
                    <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className={cn(
                        "text-sm font-medium transition-all duration-300",
                        open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute left-14"
                    )}>
                        Sign Out
                    </span>
                </button>
            </div>
        </div>
    );
};
