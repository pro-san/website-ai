import React, { useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

interface ToastProps {
  toast: { title: string; message: string; visible: boolean; type?: 'info' | 'success' | 'error' } | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast && toast.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast || !toast.visible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-indigo-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-emerald-500/20 shadow-emerald-500/[0.03]';
      case 'error': return 'border-rose-500/20 shadow-rose-500/[0.03]';
      default: return 'border-indigo-500/20 shadow-indigo-500/[0.03]';
    }
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-sm w-full rounded-2xl border bg-slate-950 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up ${getBorderColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
          <p className="text-[11px] text-slate-400 leading-normal">{toast.message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* progress meter line */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-b-2xl animate-shrink-width w-full" />
    </div>
  );
}
