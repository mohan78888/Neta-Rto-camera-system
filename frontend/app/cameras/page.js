'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

const STATUS_STYLE = {
  ONLINE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DEGRADED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  OFFLINE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const EMPTY_FORM = {
  code: '', name: '', department: '', latitude: '', longitude: '',
  cameraType: 'Fixed ANPR', sourceProtocol: 'SIMULATED', streamRef: '/sample-feeds/traffic1.mp4', zone: 'Zone A',
};

export default function CamerasPage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [cameras, setCameras] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) router.push('/login');
      else setUser(d.user);
    });
  }, [router]);

  async function loadCameras() {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const res = await fetch(`/api/cameras?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCameras(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  }

  useEffect(() => { if (user) loadCameras(); /* eslint-disable-next-line */ }, [user, q, status]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to add camera');
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    loadCameras();
  }

  async function handleDisable(id) {
    if (!confirm('Disable this camera in the registry?')) return;
    await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
    loadCameras();
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-dot" />
          <span>Loading Camera Registry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar user={user} />
      
      <div className="p-4 md:p-6 space-y-5 max-w-[1720px] mx-auto">
        <div className="flex flex-wrap gap-3 items-center justify-between pb-1 border-b border-slate-800">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Heterogeneous Camera Fleet Registry</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage camera nodes, protocols, geolocation, and streaming endpoints
            </p>
          </div>

          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setShowForm((s) => !s)} 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all flex items-center gap-1.5"
            >
              <span>{showForm ? '✕' : '+'}</span>
              <span>{showForm ? 'Close Form' : 'Onboard New Camera'}</span>
            </button>
          )}
        </div>

        {/* Onboarding Form */}
        {showForm && (
          <form onSubmit={handleAdd} className="glass-panel-glow rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="col-span-full font-bold text-xs uppercase tracking-wider text-amber-300 pb-1 border-b border-amber-500/20">
              New Camera Onboarding Parameters
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Camera Code</label>
              <input 
                placeholder="e.g. C005" 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Camera Name</label>
              <input 
                placeholder="e.g. Kalupur Railway Overbridge" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Department</label>
              <input 
                placeholder="e.g. Traffic Police" 
                value={form.department} 
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction Zone</label>
              <input 
                placeholder="e.g. Zone D" 
                value={form.zone} 
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Latitude</label>
              <input 
                placeholder="23.025" 
                value={form.latitude} 
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Longitude</label>
              <input 
                placeholder="72.580" 
                value={form.longitude} 
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Source Protocol</label>
              <select 
                value={form.sourceProtocol} 
                onChange={(e) => setForm({ ...form, sourceProtocol: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option>SIMULATED</option>
                <option>RTSP</option>
                <option>ONVIF</option>
                <option>HLS</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Camera Type</label>
              <select 
                value={form.cameraType} 
                onChange={(e) => setForm({ ...form, cameraType: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option>Fixed ANPR</option>
                <option>PTZ</option>
                <option>Fixed</option>
                <option>Body-Worn</option>
              </select>
            </div>

            <div className="col-span-full">
              <label className="text-[10px] uppercase font-bold text-slate-400">Stream Reference Endpoint</label>
              <input 
                placeholder="/sample-feeds/traffic1.mp4 or rtsp://..." 
                value={form.streamRef} 
                onChange={(e) => setForm({ ...form, streamRef: e.target.value })}
                className="w-full mt-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" 
              />
            </div>

            {error && <div className="text-rose-400 text-xs col-span-full bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">{error}</div>}

            <div className="col-span-full flex justify-end gap-2 mt-1">
              <button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg px-5 py-2 text-xs transition-colors"
              >
                Register Camera
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <input 
            placeholder="Search by code, junction name, or department..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            className="glass-panel rounded-lg px-3.5 py-2 text-sm flex-1 min-w-[240px] text-white focus:outline-none focus:border-amber-500" 
          />
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="glass-panel rounded-lg px-3.5 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Health Statuses</option>
            <option value="ONLINE">Online (Streaming)</option>
            <option value="DEGRADED">Degraded (Heartbeat Lag)</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {/* Cameras Data Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800 bg-slate-900/60">
                <tr>
                  <th className="text-left p-3.5">Code</th>
                  <th className="text-left p-3.5">Camera Name</th>
                  <th className="text-left p-3.5">Department</th>
                  <th className="text-left p-3.5">Zone</th>
                  <th className="text-left p-3.5">Protocol / Type</th>
                  <th className="text-left p-3.5">Health</th>
                  <th className="text-left p-3.5">Last Heartbeat</th>
                  {user.role === 'ADMIN' && <th className="text-left p-3.5">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cameras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-300">{c.code}</td>
                    <td className="p-3.5 font-semibold text-white">{c.name}</td>
                    <td className="p-3.5 text-slate-300">{c.department}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {c.zone}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400 font-mono">
                      {c.sourceProtocol} · {c.cameraType}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status] || STATUS_STYLE.OFFLINE}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs font-mono text-slate-400">
                      {c.lastHeartbeat ? new Date(c.lastHeartbeat).toLocaleTimeString() : '—'}
                    </td>
                    {user.role === 'ADMIN' && (
                      <td className="p-3.5">
                        <button 
                          onClick={() => handleDisable(c.id)} 
                          className="text-rose-400 hover:text-rose-300 hover:underline text-xs font-medium"
                        >
                          Disable
                        </button>
                      </td>
                    )}
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
