import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ title = 'System Synchronization Error', message, onRetry }: ErrorBannerProps) {
  return (
    <div className="relative overflow-hidden p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 shadow-2xl shadow-rose-500/5 max-w-2xl mx-auto my-12">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative flex flex-col items-center text-center space-y-6">
        <div className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/20 animate-pulse">
          <WifiOff size={40} className="text-rose-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-black text-2xl text-white tracking-tight">{title}</h3>
          <p className="text-slate-400 leading-relaxed max-w-md">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center px-6 py-3 text-sm font-bold bg-rose-500 text-white hover:bg-rose-400 rounded-xl transition-all duration-300 shadow-lg shadow-rose-500/20 active:scale-95"
            >
              <RefreshCw size={16} className="mr-2" />
              Reconnect Service
            </button>
          )}
          <div className="flex items-center px-4 py-2 bg-white/5 rounded-lg border border-white/5">
            <AlertCircle size={14} className="text-amber-400 mr-2" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Error Code: 0x503_SRV_UNAVAILABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
