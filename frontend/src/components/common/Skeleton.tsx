import React from 'react';

export const KPISkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-white/10 rounded-full"></div>
          <div className="h-10 w-10 bg-white/10 rounded-xl"></div>
        </div>
        <div className="space-y-3">
          <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
          <div className="h-3 w-32 bg-white/5 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="w-full space-y-px overflow-hidden rounded-2xl border border-white/5 bg-slate-950/20">
    <div className="h-12 bg-white/5 animate-pulse flex items-center px-6 space-x-8">
      <div className="h-3 w-1/4 bg-white/10 rounded-full"></div>
      <div className="h-3 w-1/6 bg-white/10 rounded-full"></div>
      <div className="h-3 w-1/6 bg-white/10 rounded-full"></div>
      <div className="h-3 w-1/6 bg-white/10 rounded-full"></div>
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center space-x-8 px-6 py-5 bg-slate-900/40 border-t border-white/5 animate-pulse">
        <div className="flex items-center space-x-4 flex-1">
          <div className="h-10 w-10 bg-white/10 rounded-xl shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 bg-white/10 rounded-lg"></div>
            <div className="h-3 w-1/2 bg-white/5 rounded-full"></div>
          </div>
        </div>
        <div className="h-4 w-24 bg-white/10 rounded-lg"></div>
        <div className="h-4 w-20 bg-white/10 rounded-lg"></div>
        <div className="h-4 w-16 bg-white/10 rounded-lg"></div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="h-[350px] w-full p-6 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse flex flex-col">
    <div className="flex justify-between items-center mb-8">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-white/10 rounded-lg"></div>
        <div className="h-3 w-32 bg-white/5 rounded-full"></div>
      </div>
      <div className="h-6 w-20 bg-white/5 rounded-full"></div>
    </div>
    <div className="flex-1 w-full bg-white/5 rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 flex items-end justify-around px-4 pb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-8 bg-white/10 rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }}></div>
        ))}
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ items = 4 }: { items?: number }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-900/40 border border-white/5 animate-pulse">
        <div className="h-10 w-10 bg-white/10 rounded-xl shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-white/10 rounded-lg"></div>
          <div className="h-3 w-full bg-white/5 rounded-full"></div>
          <div className="h-3 w-2/3 bg-white/5 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
);
