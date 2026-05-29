import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all duration-300 bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 group"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400 group-hover:text-amber-300" />
      )}
    </button>
  );
}