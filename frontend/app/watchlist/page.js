'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

const SEVERITY_BADGE = {
  CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  MEDIUM: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export default function WatchlistPage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ entityType: 'VEHICLE', identifier: '', reason: '', severity: 'HIGH' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) router.push('/login');
      else setUser(d.user);
    });
  }, [router]);

  async function load() {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to add entry');
        return;
      }
      setForm({ entityType: 'VEHICLE', identifier: '', reason: '', severity: 'HIGH' });
      load();
    } catch (err) {
      setError('Network error');
    }
  }

  async function toggleActive(id, active) {
    await fetch(`/api/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-dot" />
          <span>Loading Watchlist Database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar user={user} />
      
      <div className="p-4 md:p-6 space-y-5 max-w-[1720px] mx-auto">
        <div className="pb-1 border-b border-slate-800">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Watchlist Correlation Database</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time entity hotlist for automated ANPR and face recognition correlation
          </p>
        </div>

        {/* Add Entry Form */}
        <form onSubmit={handleAdd} className="glass-panel-glow rounded-xl p-5 flex flex-wrap gap-3.5 items-end">
          <div className="w-full text-xs font-bold uppercase tracking-wider text-amber-300 pb-1 border-b border-amber-500/20">
            Register Watchlist Target
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Target Type</label>
            <select 
              value={form.entityType} 
              onChange={(e) => setForm({ ...form, entityType: e.target.value })}
              className="block bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 mt-1"
            >
              <option value="VEHICLE">Vehicle (License Plate)</option>
              <option value="PERSON">Person (Biometric ID)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Target Identifier</label>
            <input 
              value={form.identifier} 
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="e.g. GJ01AB1234" 
              className="block bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400 mt-1" 
              required 
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-[10px] uppercase font-bold text-slate-400">Reason / Incident Description</label>
            <input 
              value={form.reason} 
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Reported Stolen - FIR 2026/894" 
              className="block w-full bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 mt-1" 
              required 
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Severity Tier</label>
            <select 
              value={form.severity} 
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="block bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 mt-1"
            >
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold rounded-lg px-5 py-2 text-xs shadow-md transition-all"
          >
            + Add To Watchlist
          </button>

          {error && <div className="text-rose-400 text-xs w-full bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">{error}</div>}
        </form>

        {/* Watchlist Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800 bg-slate-900/60">
                <tr>
                  <th className="text-left p-3.5">Type</th>
                  <th className="text-left p-3.5">Identifier</th>
                  <th className="text-left p-3.5">Reason</th>
                  <th className="text-left p-3.5">Severity</th>
                  <th className="text-left p-3.5">Active Status</th>
                  <th className="text-left p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-xs text-slate-300">{item.entityType}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-300 tracking-wider">{item.identifier}</td>
                    <td className="p-3.5 text-slate-200">{item.reason}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEVERITY_BADGE[item.severity] || SEVERITY_BADGE.HIGH}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.active 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button 
                        onClick={() => toggleActive(item.id, item.active)} 
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                      >
                        {item.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
