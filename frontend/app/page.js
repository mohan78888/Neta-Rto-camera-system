'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import StatsCards from '../components/StatsCards';
import CameraGrid from '../components/CameraGrid';
import AlertFeed from '../components/AlertFeed';
import EventFeed from '../components/EventFeed';
import { useSocket } from '../lib/useSocket';
import { playAlertSiren } from '../lib/sound';

const CameraMap = dynamic(() => import('../components/CameraMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[430px] glass-panel rounded-xl flex items-center justify-center text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-dot" />
        Initializing OpenStreetMap GIS Vector Mesh...
      </div>
    </div>
  )
});

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, camerasRes, alertsRes, eventsRes] = await Promise.all([
        fetch('/api/stats').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/cameras').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/alerts').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/events?limit=30').then((r) => (r.ok ? r.json() : [])),
      ]);
      setStats(statsRes || null);
      setCameras(Array.isArray(camerasRes) ? camerasRes : []);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setEvents(Array.isArray(eventsRes) ? eventsRes : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push('/login');
        else setUser(d.user);
      });
  }, [router]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  useSocket({
    new_event: (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 30));
      setStats((prev) => prev && { ...prev, totalEvents: prev.totalEvents + 1, eventsLastHour: prev.eventsLastHour + 1 });
    },
    new_alert: (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
      setStats((prev) => prev && { ...prev, activeAlerts: prev.activeAlerts + 1 });
      // Play authentic emergency warning chime
      playAlertSiren(alert.watchlist?.severity || 'HIGH');
    },
    camera_status: (camera) => {
      setCameras((prev) => prev.map((c) => (c.id === camera.id ? camera : c)));
    },
    alert_updated: (alert) => {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
    },
  });

  async function updateAlertStatus(id, status) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setStats((prev) => prev && status !== 'NEW' ? { ...prev, activeAlerts: Math.max(0, prev.activeAlerts - (status === 'ACKNOWLEDGED' ? 0 : 1)) } : prev);
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  }

  // 1-Click Manual AI Detection Trigger for Demo Recording
  async function triggerManualAIEvent() {
    setSimulating(true);
    setTriggerMessage('');
    try {
      const demoPlates = ['GJ01AB1234', 'GJ05XY9988', 'GJ27PQ4567'];
      const randomPlate = demoPlates[Math.floor(Math.random() * demoPlates.length)];
      
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: cameras[0]?.code || 'C001',
          event_type: 'ANPR',
          vehicle_number: randomPlate,
          confidence: +(0.88 + Math.random() * 0.1).toFixed(2),
          bounding_box: { x: 140, y: 80, w: 160, h: 70 }
        })
      });
      const data = await res.json();
      setTriggerMessage(`⚡ AI Event Emitted for target ${randomPlate} → Alert Triggered!`);
      setTimeout(() => setTriggerMessage(''), 4000);
    } catch (e) {
      setTriggerMessage('Failed to trigger');
    } finally {
      setSimulating(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-400 live-dot" />
          <span className="font-mono text-sm tracking-widest text-slate-300">AUTHENTICATING OPERATOR...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] relative text-slate-100">
      {/* Background Graphic Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url('/dashboard-bg.jpg')` }}
      />

      <div className="relative z-10">
        <Navbar user={user} />
        
        <main className="p-4 md:p-6 space-y-5 max-w-[1720px] mx-auto">
          {/* Header Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Integrated CCTV & AI Analytics Command</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Gujarat Police Innovation Hackathon 2026 Reference Model · 80,000 Heterogeneous Fleet Node
              </p>
            </div>

            {/* Top Interactive Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {triggerMessage && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-in fade-in">
                  {triggerMessage}
                </span>
              )}

              {/* 1-Click Demo AI Event Button */}
              <button 
                onClick={triggerManualAIEvent}
                disabled={simulating}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>⚡</span>
                <span>{simulating ? 'Processing AI...' : 'Trigger AI Alert (Demo)'}</span>
              </button>

              <button 
                onClick={loadAll}
                className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Top Telemetry Metric Cards */}
          <StatsCards stats={stats} />

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Map & Live Video Grid */}
            <div className="lg:col-span-2 space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Interactive GIS Camera Locations (Carto / OpenStreetMap)
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400">
                    Ahmedabad Metropolitan Fleet
                  </span>
                </div>
                <CameraMap cameras={cameras} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Live CCTV Video Grid (Click Any Tile to Expand)
                  </h2>
                  <span className="text-[10px] text-slate-400">
                    Heterogeneous Protocols: SIMULATED / RTSP / ONVIF / HLS
                  </span>
                </div>
                <CameraGrid cameras={cameras} />
              </div>
            </div>

            {/* Right Column: Real-Time Alerts & Events */}
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 live-dot" />
                    Priority Watchlist Alerts
                  </h2>
                  <span className="text-[10px] font-mono text-red-400 font-semibold">
                    {alerts.filter((a) => a.status === 'NEW').length} PENDING
                  </span>
                </div>
                <AlertFeed alerts={alerts} onUpdateStatus={updateAlertStatus} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    AI Detection Telemetry Stream
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400">
                    Real-Time ANPR
                  </span>
                </div>
                <EventFeed events={events} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
