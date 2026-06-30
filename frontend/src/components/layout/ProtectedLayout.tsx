import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check authentication once on mount
    checkAuth();
  }, [checkAuth]);

  // Listen to custom unauthorized event to redirect instantly
  useEffect(() => {
    const handleUnauthorized = () => {
      // Force reload or redirect
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-slate-800" />
          <div className="absolute h-16 w-16 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
          <span className="absolute font-heading font-black text-sm tracking-wider text-slate-100">DSA</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
          Securing Connection...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Sidebar - Collapsible */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 bg-slate-950 bg-grid-pattern relative">
          <div className="max-w-6xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
