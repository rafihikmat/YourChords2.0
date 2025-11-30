import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import AIChordForm from '../../components/AIChordForm';
import { AdminSidebar } from './components/AdminSidebar';
import Overview from './views/Overview';
import RoleManager from './views/RoleManager';
import ContentManager from './views/ContentManager';
import MaintenanceConsole from './views/MaintenanceConsole';
import SongManager from './views/SongManager';
import AssetManager from './views/AssetManager';
import ManualEntry from './views/ManualEntry';
import { useTheme } from '../../lib/hooks';

/**
 * The main layout component for the Admin Dashboard.
 * Features a collapsible sidebar, a top header with theme toggling, and nested routing for admin modules.
 *
 * @returns {JSX.Element} The AdminDashboard component.
 */
const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex font-sans text-slate-900 dark:text-white transition-colors duration-500 bg-slate-50/50 dark:bg-slate-950">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <AdminSidebar open={sidebarOpen} />
      
      <div className={cn("flex-1 transition-all duration-500 ease-out relative z-10", sidebarOpen ? "ml-72" : "ml-20")}>
        <header className="h-20 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-300 dark:border-slate-800 sticky top-0 z-40 px-8 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-white/5 text-slate-600 dark:text-white border border-slate-200/60 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Admin User</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Administrator</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 ring-2 ring-white/20 dark:ring-black/20">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] p-6">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="cms" element={<ContentManager />} />
              <Route path="songs" element={<SongManager />} />
              <Route path="manual-entry" element={<ManualEntry />} />
              <Route path="assets" element={<AssetManager />} />
              <Route path="ai-create" element={<div className="p-8"><h2 className="text-2xl font-bold mb-6">AI Song Generator</h2><AIChordForm /></div>} />
              <Route path="cache" element={<MaintenanceConsole />} />
              <Route path="roles" element={<RoleManager />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
