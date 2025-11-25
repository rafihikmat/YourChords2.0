
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ChatPage from './pages/Chat';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Auth from './pages/Auth';
import UpdatePassword from './pages/UpdatePassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import SongDetail from './pages/SongDetail';
import FavoritesPage from './pages/Favorites';
import ToolsPage from './pages/Tools';
import ProfilePage from './pages/Profile';
import About from './pages/About';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatabaseSetupScreen } from './components/setup/DatabaseSetupScreen';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

/**
 * The main content wrapper component.
 * Handles global layouts, routing, and connection error states.
 *
 * @returns {JSX.Element} The AppContent component.
 */
const AppContent: React.FC = () => {
  const { dbConnectionError } = useAuth();
  const location = useLocation();
  
  // Global Check: If DB connection has issues (missing tables), show SQL setup
  if (dbConnectionError) return <DatabaseSetupScreen />;

  // Determine if footer should be shown (Hide on Admin and Auth pages)
  const showFooter = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/update-password');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/about" element={<About />} />
            
            {/* Protected Routes */}
            <Route path="/favorites" element={
                <ProtectedRoute>
                    <FavoritesPage />
                </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfilePage />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
                <AdminDashboard />
            </ProtectedRoute>
            } />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

/**
 * The root application component.
 * Configures the Router, AuthProvider, and global theme settings.
 *
 * @returns {JSX.Element} The App component.
 */
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-primary/30 overflow-x-hidden transition-colors duration-300">
            <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
