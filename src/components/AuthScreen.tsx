import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Map } from 'lucide-react';
import { signInWithGoogle, checkAndCreateUserProfile } from '../services/authService';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Display name is required for registration.');
        }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await checkAndCreateUserProfile(result.user, displayName);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-[#050505] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-panel bg-white/90 dark:bg-black/40 rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-black/10 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-black/5 dark:bg-white/5">
            <Map className="h-8 w-8 text-slate-900 dark:text-white opacity-90" />
          </div>
          <h2 className="mt-2 text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Territory Run
          </h2>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide uppercase">
            {isLogin ? 'Sign in to claim your territory' : 'Create an account to start running'}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 backdrop-blur-sm">
            <p className="text-sm text-red-400 font-medium text-center">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
          <div className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <User className="h-5 w-5 text-slate-600 group-focus-within:text-teal-400 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500/50 focus:bg-white/60 dark:focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-teal-500/50 sm:text-sm transition-all backdrop-blur-sm"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-teal-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                className="block w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500/50 focus:bg-white/60 dark:focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-teal-500/50 sm:text-sm transition-all backdrop-blur-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-teal-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                className="block w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500/50 focus:bg-white/60 dark:focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-teal-500/50 sm:text-sm transition-all backdrop-blur-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-teal-500/20 px-4 py-4 text-xs font-bold uppercase tracking-widest text-teal-400 hover:bg-teal-500/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-[#050505] disabled:opacity-50 transition-all duration-300 hover:scale-[0.98] shadow-[0_0_20px_rgba(20,184,166,0.1)]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-white/80 dark:bg-black/60 backdrop-blur-md px-4 py-1 text-slate-600 dark:text-slate-400 rounded-full border border-black/5 dark:border-white/5">Or continue with</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-4 text-sm font-medium text-slate-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-[#050505] disabled:opacity-50 transition-all duration-300 hover:scale-[0.98] backdrop-blur-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
