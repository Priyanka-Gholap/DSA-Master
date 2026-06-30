import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  Code, 
  History, 
  Bookmark, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  LogOut,
  FileText,
  BarChart2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, isReady: true },
    { name: 'Roadmap', path: '/roadmap', icon: Map, isReady: true },
    { name: 'Topics', path: '/topics', icon: BookOpen, isReady: true },
    { name: 'Practice', path: '/practice', icon: Code, isReady: true },
    { name: 'Notes', path: '/notes', icon: FileText, isReady: true },
    { name: 'Revision', path: '/revision', icon: History, isReady: true },
    { name: 'Analytics', path: '/analytics', icon: BarChart2, isReady: true },
    { name: 'Visualizer', path: '/visualizer', icon: Terminal, isReady: true },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark, isReady: true },
    { name: 'Settings', path: '/settings', icon: Settings, isReady: true },
  ];

  return (
    <>
      {/* Mobile Sidebar overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <motion.aside
        animate={{ width: isOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800/80 lg:static shrink-0 h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Terminal className="h-4 w-4" />
            </div>
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-heading font-black text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight whitespace-nowrap"
                >
                  DSA Master
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-white transition-colors text-slate-400 cursor-pointer"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive: linkActive }) =>
                  cn(
                    "flex items-center gap-3.5 px-3 py-3.5 rounded-xl transition-all duration-200 group text-sm font-medium relative",
                    linkActive || isActive
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent"
                  )
                }
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                )} />
                
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between w-full"
                  >
                    <span>{item.name}</span>
                    {!item.isReady && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500 uppercase tracking-widest font-bold scale-90 group-hover:bg-slate-750">
                        Soon
                      </span>
                    )}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/40">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3.5 w-full px-3 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-sm font-medium cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
