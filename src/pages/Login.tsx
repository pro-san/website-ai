import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Shield, HelpCircle, ArrowRight, RefreshCw, AlertCircle, Key, Mail, Gift, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onAuthSuccess: (user: User, token: string) => void;
  onBackToHome: () => void;
}

export default function Login({ onAuthSuccess, onBackToHome }: LoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState<string | null>(null);

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'creator'>('user');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRef = urlParams.get('ref');
    if (urlRef) {
      localStorage.setItem('referralCode', urlRef);
      sessionStorage.setItem('referralCode', urlRef);
      setRefCode(urlRef);
      // Auto-switch to register mode to make sign up convenient
      setIsRegisterMode(true);
    } else {
      const stored = localStorage.getItem('referralCode') || sessionStorage.getItem('referralCode');
      if (stored) {
        setRefCode(stored);
      }
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isRegisterMode && !name)) {
      setError('Please complete all form fields.');
      return;
    }

    setLoading(true);
    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode 
      ? { name, email, password, role, referralCode: refCode }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (isRegisterMode) {
          // Clear used referral code
          localStorage.removeItem('referralCode');
          sessionStorage.removeItem('referralCode');
        }
        onAuthSuccess(data.user, data.token);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Authentication task failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to reach auth server.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill defaults for presentation
  const handleQuickLogin = (emailType: 'admin' | 'creator' | 'user') => {
    setError('');
    if (emailType === 'admin') {
      setEmail('admin@prodigital.net');
      setPassword('admin123');
    } else if (emailType === 'creator') {
      setEmail('creator@prodigital.net');
      setPassword('creator123');
    } else {
      setEmail('user@prodigital.net');
      setPassword('user123');
    }
    setIsRegisterMode(false);
  };

  const triggerForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first to request a password reset.');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
      } else {
        setError('Email address not registered.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="max-w-md w-full space-y-6">
        {/* Header branding */}
        <div className="text-center space-y-2">
          <div onClick={onBackToHome} className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isRegisterMode ? 'Register an Account' : 'Welcome back to PRO DIGITAL™'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegisterMode ? 'Join the community of developers and start deploying models.' : 'Enter your credentials to unlock active workspaces.'}
          </p>
        </div>

        {/* Floating error logger */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Referral Promo Notice */}
        {isRegisterMode && refCode && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400 animate-pulse">
            <Gift className="h-5 w-5 shrink-0 text-emerald-400 animate-bounce" />
            <div>
              <p className="font-extrabold text-emerald-300 text-xs">Referral Promotion Active! 🎁</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                You were invited by a friend. Sign up now and you'll receive <span className="text-emerald-400 font-extrabold">150 extra starting credits</span> (650 total) for free!
              </p>
            </div>
          </div>
        )}

        {/* Auth form card */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sarah Connor"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role Node</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`rounded-xl border py-2 text-center text-xs font-bold uppercase transition ${
                        role === 'user' 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : 'border-slate-850 bg-slate-900/40 text-slate-500 hover:text-white'
                      }`}
                    >
                      User Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('creator')}
                      className={`rounded-xl border py-2 text-center text-xs font-bold uppercase transition ${
                        role === 'creator' 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : 'border-slate-850 bg-slate-900/40 text-slate-500 hover:text-white'
                      }`}
                    >
                      AI Creator
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. buyer@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secret Password</label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={triggerForgotPassword}
                    className="text-[10px] font-semibold text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold py-3.5 text-xs transition shadow-lg shadow-indigo-600/20"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {isRegisterMode ? 'Complete Registration' : 'Authenticate Session'}
            </button>
          </form>

          {/* Toggle register/login mode */}
          <div className="mt-6 text-center border-t border-slate-900 pt-4">
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account yet? Register Free"}
            </button>
          </div>
        </div>

        {/* DEMO BYPASS BOX */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 space-y-2.5">
          <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono text-center">Developer Quick-Log Bypass</span>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleQuickLogin('user')}
              className="rounded bg-slate-900 border border-slate-850 hover:border-slate-700 p-1.5 text-[10px] font-bold text-slate-300 transition"
            >
              Buyer Bypass
            </button>
            <button 
              onClick={() => handleQuickLogin('creator')}
              className="rounded bg-slate-900 border border-slate-850 hover:border-slate-700 p-1.5 text-[10px] font-bold text-indigo-400 transition"
            >
              Creator Bypass
            </button>
            <button 
              onClick={() => handleQuickLogin('admin')}
              className="rounded bg-slate-900 border border-slate-850 hover:border-slate-700 p-1.5 text-[10px] font-bold text-pink-400 transition"
            >
              Admin Bypass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
