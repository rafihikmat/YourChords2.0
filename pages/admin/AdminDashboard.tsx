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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <AdminSidebar open={sidebarOpen} />
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
        <header className="h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm no-print">
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
