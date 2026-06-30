import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Terminal, Github } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export const RootLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Marketing Header */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <span className="font-heading font-black text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:text-white transition-colors">
              DSA Master
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#benefits" className="hover:text-slate-100 transition-colors">Benefits</a>
            <a href="#why-us" className="hover:text-slate-100 transition-colors">Why Choose Us</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')} variant="primary" size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Marketing Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white">
              <Terminal className="h-3.5 w-3.5" />
            </div>
            <span className="font-heading font-semibold text-sm text-slate-300">
              DSA Master &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
