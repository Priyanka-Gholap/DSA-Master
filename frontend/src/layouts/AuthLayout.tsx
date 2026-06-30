import React from 'react';
import { Link, Outlet, Navigate } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // If already logged in, redirect straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-[0.12]" />

      <div className="w-full max-w-[440px] relative z-10 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Terminal className="h-5 w-5" />
            </div>
          </Link>
          <h2 className="font-heading font-black text-2xl tracking-tight text-white mt-3">
            Welcome to DSA Master
          </h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Premium Java DSA Learning
          </p>
        </div>

        {/* Card containing Login/Register Forms */}
        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800/80">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <Outlet />
        </div>
      </div>
    </div>
  );
};
