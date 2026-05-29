import React from 'react';
import { LucideIcon, Inbox, MousePointer2 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  onClear?: () => void;
}

export default function EmptyState({ title, description, icon: Icon = Inbox, onClear }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center p-16 text-center rounded-3xl glass-panel border border-white/5 bg-slate-900/40 space-y-8 overflow-hidden">
      {/* Illustrative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative">
        {/* Double ring illustration */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative">
          <div className="p-8 bg-slate-950/80 rounded-full border border-white/10 text-indigo-400 shadow-2xl transform hover:rotate-12 transition-transform duration-500">
            <Icon size={56} className="opacity-90" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-500 rounded-lg shadow-lg animate-bounce">
            <MousePointer2 size={16} className="text-white" />
          </div>
        </div>
      </div>
      
      <div className="relative max-w-sm space-y-3">
        <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {onClear && (
        <button
          onClick={onClear}
          className="relative group px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <span className="relative z-10 flex items-center justify-center">
            Reset View Parameters
          </span>
        </button>
      )}
    </div>
  );
}
