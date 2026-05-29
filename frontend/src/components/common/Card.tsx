import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, headerAction, noPadding = false }) => {
  return (
    <div className={`glass-panel rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-slate-900/40 ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;