'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@netra.gov.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError('Network error during authentication');
    }
  }

  function quickFill(roleEmail) {
    setEmail(roleEmail);
    setPassword('password123');
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#07090e]">
      {/* Background Graphic Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 filter blur-[1px]" 
        style={{ backgroundImage: `url('/login-bg.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-[#07090e]/40" />

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-7 relative z-10 border border-slate-700/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] mb-3">
            <Image 
              src="/logo.jpg" 
              alt="okDriver" 
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>Netra</span>
            <span className="text-sm font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              CCTV
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Smart AI Road Safety & Police Surveillance Command Center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Operator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 bg-[#090d16]/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1.5 bg-[#090d16]/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              required
            />
          </div>

          {error && (
            <div className="text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold rounded-lg py-2.5 text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Command Center →'}
          </button>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2 text-center">
            Demo Credentials (1-Click Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('admin@netra.gov.in')}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors"
            >
              <div className="font-semibold text-amber-300">Admin Role</div>
              <div className="text-[10px] text-slate-400 truncate">admin@netra.gov.in</div>
            </button>
            <button
              type="button"
              onClick={() => quickFill('operator@netra.gov.in')}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left transition-colors"
            >
              <div className="font-semibold text-blue-300">Operator Role</div>
              <div className="text-[10px] text-slate-400 truncate">operator@netra.gov.in</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
