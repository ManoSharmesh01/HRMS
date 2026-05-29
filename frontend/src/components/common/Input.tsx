import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-slate-900/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50
              transition-all duration-200
              ${leftIcon ? 'pl-11' : ''}
              ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : 'border-white/10 hover:border-white/20'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-400 ml-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 ml-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
