import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LogOut,
  X,
  Activity,
  Bell,
  Users,
  Clock
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Employees', path: '/employees', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex flex-col glass-panel transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                HRMS Portal
              </h1>
              <span className="text-xs text-indigo-400/80 font-medium uppercase tracking-wider">Enterprise</span>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} className={`mr-3 transition-transform duration-300 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-400 group-hover:text-indigo-300'}`} />
                    <span className="font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/5 bg-slate-950/25">
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 border border-white/5 mb-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}