import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Soft background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full glass-card border-slate-800 p-8 rounded-2xl text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
        
        {/* Lock Icon */}
        <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/25 text-rose-450 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-heading font-black text-2xl text-white tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            You do not have permission to access this page. Please sign in with an authorized account.
          </p>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => navigate('/login')} 
            variant="primary" 
            className="w-full"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Go to Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
