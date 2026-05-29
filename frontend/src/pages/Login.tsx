import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val: string) => {
    if (!val) {
      return 'Email address is required';
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) {
      return 'Password is required';
    }
    if (val.length < 4) {
      return 'Password must be at least 4 characters';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      setEmailError(validateEmail(val));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) {
      setPasswordError(validatePassword(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setApiError(
        err.response?.data?.error ||
        'Failed to sign in. Please verify credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@hrms.com');
    setPassword('admin123');
    setEmailError('');
    setPasswordError('');
    setApiError('');
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gradient-to-tr dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 relative overflow-hidden'>
      <div className='absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none' />

      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className='w-full max-w-md p-8 rounded-2xl glass-panel relative overflow-hidden shadow-2xl transition-all duration-300 border border-black/5 dark:hover:border-white/10'>
        <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className='flex flex-col items-center mb-8'>
          <div className='p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 shadow-glass-sm'>
            <ShieldCheck size={32} />
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1'>
            Welcome to HRMS Portal
          </h2>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Sign in to access your dashboard
          </p>
        </div>

        {apiError && (
          <div className='mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium flex items-start space-x-2.5 animate-fadeIn'>
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5' noValidate>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className='block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider'>
                Email Address
              </label>
              {email && !emailError && (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ready
                </span>
              )}
            </div>
            <div className='relative'>
              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-colors duration-200 ${emailError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                <Mail size={18} />
              </span>
              <input
                type='email'
                placeholder='admin@hrms.com'
                value={email}
                onChange={handleEmailChange}
                className={`w-full pl-10 pr-10 py-3 rounded-xl glass-input text-sm ${
                  emailError 
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' 
                    : ''
                }`}
                disabled={isSubmitting}
              />
              {emailError && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} />
                </span>
              )}
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 animate-fadeIn">
                <span>{emailError}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className='block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider'>
                Password
              </label>
              {password && !passwordError && (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ready
                </span>
              )}
            </div>
            <div className='relative'>
              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-colors duration-200 ${passwordError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                <Lock size={18} />
              </span>
              <input
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={handlePasswordChange}
                className={`w-full pl-10 pr-10 py-3 rounded-xl glass-input text-sm ${
                  passwordError 
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' 
                    : ''
                }`}
                disabled={isSubmitting}
              />
              {passwordError && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={18} />
                </span>
              )}
            </div>
            {passwordError && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 animate-fadeIn">
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full py-3.5 rounded-xl text-sm font-bold text-white glass-button flex items-center justify-center cursor-pointer transition-all duration-300'
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className='animate-spin mr-2' />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className='mt-8 text-center border-t border-black/5 dark:border-white/5 pt-5'>
          <p className='text-xs text-slate-500 mb-2.5'>
            To quickly experience the system:
          </p>
          <button
            onClick={handleQuickFill}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 text-xs font-semibold transition-all duration-200 inline-flex items-center gap-1.5 hover:scale-105 active:scale-95"
          >
            Use Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}