
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DatabaseSetupScreen } from '../setup/DatabaseSetupScreen';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
    /** The child components to render if access is granted. */
    children: React.ReactNode;
    /** If true, restricts access to admins only. */
    adminOnly?: boolean;
}

/**
 * A wrapper component that protects routes from unauthorized access.
 * Checks for user authentication and optionally admin privileges.
 * Redirects unauthenticated users to the login page or unauthorized users to the home page.
 * Also handles database connection errors by showing the setup screen.
 *
 * @param {ProtectedRouteProps} props - The component props.
 * @returns {JSX.Element} The protected content or a redirect.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly }) => {
  const { user, isAdmin, loading, dbConnectionError } = useAuth();

  // If DB is missing tables, stop everything and show setup screen
  if (dbConnectionError) return <DatabaseSetupScreen />;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">Loading Neural Interface...</div>;
  
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
