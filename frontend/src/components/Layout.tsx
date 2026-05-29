import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Activity } from 'lucide-react';
import ThemeToggle from './common/ThemeToggle';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-gradient-to-tr dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <header className="h-20 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 lg:hidden glass-panel-light shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <Activity size={20} />
            </div>
            <h1 className="text-md font-bold tracking-tight text-slate-900 dark:text-white">HRMS</h1>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg hover:bg-white/5 border border-black/5 dark:border-white/10 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <div className="flex justify-end mb-4 hidden lg:flex">
            <ThemeToggle />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}