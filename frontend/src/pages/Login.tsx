import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        'Failed to sign in. Please verify credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none' />

      <div className='w-full max-w-md p-8 rounded-2xl glass-panel relative overflow-hidden'>
        <div className='flex flex-col items-center mb-8'>
          <div className='p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4 shadow-glass-sm'>
            <ShieldCheck size={32} />
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-white mb-1'>
            Welcome to HRMS Portal
          </h2>
          <p className='text-sm text-slate-400'>
            Sign in to access your dashboard
          </p>
        </div>

        {error && (
          <div className='mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400'>
                <Mail size={18} />
              </span>
              <input
                type='email'
                required
                placeholder='admin@hrms.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm'
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2'>
              Password
            </label>
            <div className='relative'>
              <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400'>
                <Lock size={18} />
              </span>
              <input
                type='password'
                required
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm'
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full py-3.5 rounded-xl text-sm font-bold text-white glass-button flex items-center justify-center cursor-pointer'
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

        <div className='mt-8 text-center text-xs text-slate-500 border-t border-white/5 pt-4'>
          Demo Credentials: <span className='text-slate-400'>admin@hrms.com</span> / <span className='text-slate-400'>admin123</span>
        </div>
      </div>
    </div>
  );
}