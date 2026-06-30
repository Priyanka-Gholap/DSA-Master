import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const styles = {
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
  };

  const icons = {
    info: <Info className="h-5 w-5 text-indigo-400" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-400" />,
    danger: <XCircle className="h-5 w-5 text-rose-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex gap-3.5 p-4 rounded-xl border glass-card shadow-lg',
        styles[variant],
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-semibold text-sm leading-tight text-white">{title}</h4>}
        <p className="text-xs font-medium opacity-90 leading-normal">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 self-start p-1 -mr-1.5 rounded-lg hover:bg-white/10 transition-colors text-current cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};
