import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      case '/roadmap':
        return 'Java Roadmap';
      case '/topics':
        return 'DSA Topics';
      case '/practice':
        return 'Practice Board';
      case '/revision':
        return 'Revision Planner';
      case '/analytics':
        return 'Performance';
      case '/ai-mentor':
        return 'AI Mentor';
      case '/bookmarks':
        return 'Bookmarks';
      default:
        return 'DSA Master';
    }
  };

  return (
    <header className="h-16 glass-navbar flex items-center justify-between px-6 sticky top-0 z-30 select-none">
      {/* Left side: Burger & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-heading font-bold text-base md:text-lg tracking-tight text-white uppercase tracking-wider">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Actions & User Dropdown */}
      <div className="flex items-center gap-4">


        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800/60"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold border border-indigo-450/40">
              {user?.avatar ? user.avatar : user?.fullName.charAt(0).toUpperCase()}
            </div>
            
            <span className="hidden sm:inline text-xs font-semibold text-slate-300">
              {user?.fullName.split(' ')[0]}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-slate-800/85 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md"
              >
                {/* User Info details */}
                <div className="px-3.5 py-2.5 border-b border-slate-850/50 mb-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition-colors text-xs font-medium"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition-colors text-xs font-medium"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>

                <div className="border-t border-slate-850/50 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors text-xs font-medium cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
