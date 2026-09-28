'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { isSoundEnabled, setSoundEnabled as saveSoundSetting } from '../lib/sound';

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clock, setClock] = useState('');
  const [soundEnabled, setSoundState] = useState(true);

  useEffect(() => {
    setSoundState(isSoundEnabled());
    function updateClock() {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: '/', label: 'Command Center', icon: '📡' },
    { href: '/cameras', label: 'Camera Fleet', icon: '📹' },
    { href: '/watchlist', label: 'Watchlist Engine', icon: '🎯' },
    { href: '/vehicle', label: 'Vehicle Trace', icon: '🔍' },
  ];

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function toggleSound() {
    const nextState = !soundEnabled;
    setSoundState(nextState);
    saveSoundSetting(nextState);
  }

  return (
    <nav className="border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-md px-4 py-2 flex items-center justify-between sticky top-0 z-[1000] shadow-2xl">
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform duration-200">
            <Image 
              src="/logo.jpg" 
              alt="Netra CCTV" 
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-amber-400 via-amber-200 to-red-500 bg-clip-text text-transparent">
                Netra
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                CCTV
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
              Smart AI Command Center
            </span>
          </div>
        </Link>

        {/* Live Threat & Fleet Indicator */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot shadow-[0_0_8px_#34d399]" />
            <span className="font-semibold text-emerald-400 tracking-wider">FLEET ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="font-semibold">DEFCON: SURVEILLANCE READY</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex gap-1">
          {links.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span className="text-xs">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Digital Clock */}
        {clock && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 font-mono text-[11px] font-bold text-amber-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot" />
            <span>{clock}</span>
          </div>
        )}

        {/* Audio Alert Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Alert sirens enabled' : 'Muted'}
          className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${
            soundEnabled 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
        >
          <span>{soundEnabled ? '🔔' : '🔕'}</span>
          <span className="hidden lg:inline text-[10px] font-mono font-semibold">
            {soundEnabled ? 'SOUND ON' : 'MUTED'}
          </span>
        </button>

        {user && (
          <>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs font-medium text-slate-300">{user.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase ${
                user.role === 'ADMIN' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-slate-700/60 transition-colors"
            >
              Exit
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
