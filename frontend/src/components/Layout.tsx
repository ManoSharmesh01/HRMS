import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Activity } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 lg:hidden glass-panel-light shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Activity size={20} />
            </div>
            <h1 className="text-md font-bold tracking-tight text-white">HRMS</h1>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/10 transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}