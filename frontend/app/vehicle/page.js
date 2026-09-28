'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '../../components/Navbar';

const CameraMap = dynamic(() => import('../../components/CameraMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[420px] glass-panel rounded-xl flex items-center justify-center text-slate-400 text-sm">
      Loading Movement Route GIS...
    </div>
  )
});

export default function VehiclePage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);

  // Multi-Target State
  const [mode, setMode] = useState('single'); // 'single' | 'multi'
  const [target1, setTarget1] = useState('GJ01AB1234');
  const [target2, setTarget2] = useState('GJ05XY9988');

  // Results State
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('both'); // 'target1' | 'target2' | 'both'

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) router.push('/login');
      else {
        setUser(d.user);
        // Auto-run initial demo trace
        traceTargets('GJ01AB1234', null);
      }
    });
  }, [router]);

  async function fetchVehicle(plate) {
    if (!plate || !String(plate).trim()) return null;
    const clean = String(plate).trim().toUpperCase();
    try {
      const res = await fetch(`/api/vehicle/${encodeURIComponent(clean)}`);
      if (res.ok) {
        return await res.json();
      }
      return { vehicleNumber: clean, route: [], error: 'Vehicle not found' };
    } catch (e) {
      return { vehicleNumber: clean, route: [], error: 'Network error' };
    }
  }

  async function traceTargets(plate1, plate2) {
    const rawT1 = plate1 !== undefined ? plate1 : target1;
    const rawT2 = plate2 !== undefined ? plate2 : target2;
    const t1 = rawT1 ? String(rawT1).trim().toUpperCase() : '';
    const t2 = rawT2 ? String(rawT2).trim().toUpperCase() : '';

    if (!t1 && !t2) return;
    setLoading(true);

    try {
      const [res1, res2] = await Promise.all([
        t1 ? fetchVehicle(t1) : Promise.resolve(null),
        (mode === 'multi' || plate2) && t2 ? fetchVehicle(t2) : Promise.resolve(null),
      ]);

      setData1(res1);
      setData2(res2);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    traceTargets(target1, mode === 'multi' ? target2 : null);
  }

  // Calculate common intersection points between target1 and target2
  const commonCrossings = [];
  if (data1?.route && data2?.route && mode === 'multi') {
    const map1 = new Map(data1.route.map((r) => [r.code, r]));
    data2.route.forEach((r2) => {
      if (map1.has(r2.code)) {
        const r1 = map1.get(r2.code);
        const timeDiffMins = Math.abs(new Date(r1.timestamp) - new Date(r2.timestamp)) / (1000 * 60);
        commonCrossings.push({
          camera: r1.camera,
          code: r1.code,
          timeDiffMins: Math.round(timeDiffMins),
          t1Time: new Date(r1.timestamp).toLocaleTimeString(),
          t2Time: new Date(r2.timestamp).toLocaleTimeString(),
        });
      }
    });
  }

  // Multi-routes array for CameraMap
  const multiRoutes = [];
  if (data1?.route && data1.route.length > 0) {
    multiRoutes.push({
      id: data1.vehicleNumber,
      label: `Target 1: ${data1.vehicleNumber}`,
      color: '#ef4444',
      route: data1.route,
    });
  }
  if (mode === 'multi' && data2?.route && data2.route.length > 0) {
    multiRoutes.push({
      id: data2.vehicleNumber,
      label: `Target 2: ${data2.vehicleNumber}`,
      color: '#06b6d4',
      route: data2.route,
    });
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-dot" />
          <span>Loading Vehicle Trace Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar user={user} />

      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-800">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Vehicle Movement & Convoy Trace</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Simultaneous Multi-Target Route Tracking · Common Crossing Point & Convoy Analysis
            </p>
          </div>

          {/* Single vs Multi-Target Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setMode('single');
                setData2(null);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Target
            </button>
            <button
              onClick={() => {
                setMode('multi');
                traceTargets(target1, target2);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'multi'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎯</span>
              <span>Multi-Target (Convoy)</span>
            </button>
          </div>
        </div>

        {/* Search Console */}
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Target 1 Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  TARGET #1 (RED TRAJECTORY)
                </label>
                <input
                  value={target1}
                  onChange={(e) => setTarget1(e.target.value)}
                  placeholder="e.g. GJ01AB1234"
                  className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider text-rose-300 placeholder:text-slate-600 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Target 2 Input (if multi-mode) */}
              {mode === 'multi' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    TARGET #2 (CYAN TRAJECTORY - CONVOY/ACCOMPLICE)
                  </label>
                  <input
                    value={target2}
                    onChange={(e) => setTarget2(e.target.value)}
                    placeholder="e.g. GJ05XY9988"
                    className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* Quick Demo Target Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-[10px] uppercase font-bold text-slate-500">Presets:</span>
                {mode === 'single' ? (
                  ['GJ01AB1234', 'GJ05XY9988', 'GJ27PQ4567'].map((plate) => (
                    <button
                      key={plate}
                      type="button"
                      onClick={() => {
                        setTarget1(plate);
                        traceTargets(plate, null);
                      }}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 text-slate-300 transition-colors"
                    >
                      {plate}
                    </button>
                  ))
                ) : (
                  [
                    { label: 'Convoy A (Stolen + Blacklisted)', t1: 'GJ01AB1234', t2: 'GJ05XY9988' },
                    { label: 'Suspect Pair B', t1: 'GJ27PQ4567', t2: 'GJ18CD3321' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTarget1(p.t1);
                        setTarget2(p.t2);
                        traceTargets(p.t1, p.t2);
                      }}
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 text-slate-300 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg px-6 py-2 text-xs shadow-md transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                <span>{loading ? 'Tracing Trajectories...' : mode === 'multi' ? 'Compare Targets' : 'Trace Vehicle'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="glass-panel rounded-xl p-8 text-center text-slate-400 text-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-dot" />
              Scanning camera logs and reconstructing multi-target GIS trajectories...
            </div>
          </div>
        )}

        {/* Convoy Detection Alert Banner */}
        {commonCrossings.length > 0 && !loading && (
          <div className="glass-panel-glow rounded-xl p-4 border border-amber-500/50 flex items-start gap-3 shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-pulse">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-black text-sm text-amber-300 uppercase tracking-wide">
                CONVOY / ACCOMPLICE DETECTED — {commonCrossings.length} COMMON JUNCTION CROSSING(S)
              </div>
              <div className="text-xs text-slate-200 mt-1 space-y-0.5">
                {commonCrossings.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono">
                    <span className="text-amber-400 font-bold">{c.camera} ({c.code}):</span>
                    <span>Target 1 crossed at <b>{c.t1Time}</b>, Target 2 crossed at <b>{c.t2Time}</b> (~{c.timeDiffMins} mins interval)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map & Timeline Section */}
        {!loading && (data1 || data2) && (
          <div className="space-y-4">
            {/* GIS Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  GIS Multi-Trajectory Visualization
                </h2>
                <div className="text-[11px] font-mono text-slate-400">
                  {multiRoutes.reduce((sum, r) => sum + r.route.length, 0)} total sightings plotted
                </div>
              </div>

              <CameraMap 
                multiRoutes={multiRoutes}
                center={data1?.route?.[0] ? [data1.route[0].lat, data1.route[0].lng] : [23.03, 72.58]} 
                zoom={12} 
              />
            </div>

            {/* Timeline View Tabs */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Chronological Stop Timeline
                </h2>

                {mode === 'multi' && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveTab('both')}
                      className={`px-2.5 py-1 rounded font-bold ${activeTab === 'both' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      onClick={() => setActiveTab('target1')}
                      className={`px-2.5 py-1 rounded font-bold ${activeTab === 'target1' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
                    >
                      {target1}
                    </button>
                    <button
                      onClick={() => setActiveTab('target2')}
                      className={`px-2.5 py-1 rounded font-bold ${activeTab === 'target2' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      {target2}
                    </button>
                  </div>
                )}
              </div>

              {/* Side-by-side or Single Timeline */}
              <div className={`grid gap-4 ${mode === 'multi' && activeTab === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Target 1 List */}
                {(activeTab === 'both' || activeTab === 'target1') && data1?.route && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400 pb-1 border-b border-rose-500/20">
                      <span>Target 1: {data1.vehicleNumber}</span>
                      <span className="font-mono text-[11px] text-slate-400">{data1.route.length} stops</span>
                    </div>

                    {data1.route.map((r, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 hover:border-rose-500/40 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">{r.camera}</span>
                            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-rose-300 font-semibold shrink-0">
                              {r.code}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>Conf: <b className="text-emerald-400 font-mono">{(r.confidence * 100).toFixed(0)}%</b></span>
                            {r.speedKmH && (
                              <>
                                <span>•</span>
                                <span className={r.isSpeedViolation ? 'text-rose-400 font-bold' : 'text-slate-300'}>{r.speedKmH} km/h</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Target 2 List */}
                {mode === 'multi' && (activeTab === 'both' || activeTab === 'target2') && data2?.route && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400 pb-1 border-b border-cyan-500/20">
                      <span>Target 2: {data2.vehicleNumber}</span>
                      <span className="font-mono text-[11px] text-slate-400">{data2.route.length} stops</span>
                    </div>

                    {data2.route.map((r, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">{r.camera}</span>
                            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 font-semibold shrink-0">
                              {r.code}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>Conf: <b className="text-emerald-400 font-mono">{(r.confidence * 100).toFixed(0)}%</b></span>
                            {r.speedKmH && (
                              <>
                                <span>•</span>
                                <span className={r.isSpeedViolation ? 'text-rose-400 font-bold' : 'text-slate-300'}>{r.speedKmH} km/h</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
