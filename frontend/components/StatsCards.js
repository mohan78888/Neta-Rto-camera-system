'use client';

function StatCard({ label, value, subtext, accent, glowColor, icon }) {
  return (
    <div className={`glass-panel rounded-xl p-3.5 flex-1 min-w-[145px] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${glowColor || 'hover:border-slate-700'}`}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
        {icon && <span className="text-sm opacity-80">{icon}</span>}
      </div>
      <div className={`text-2xl font-black mt-1 tracking-tight ${accent || 'text-slate-100'}`}>
        {value ?? '—'}
      </div>
      {subtext && (
        <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
          {subtext}
        </div>
      )}
    </div>
  );
}

export default function StatsCards({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      <StatCard 
        label="Fleet Cameras" 
        value={stats.totalCameras} 
        icon="📹"
        subtext="Registered Units"
      />
      <StatCard 
        label="Live Online" 
        value={stats.online} 
        accent="text-emerald-400" 
        glowColor="hover:border-emerald-500/40"
        icon="🟢"
        subtext="Streaming Normal"
      />
      <StatCard 
        label="Degraded" 
        value={stats.degraded} 
        accent="text-amber-400" 
        glowColor="hover:border-amber-500/40"
        icon="🟡"
        subtext="Heartbeat Jitter"
      />
      <StatCard 
        label="Offline" 
        value={stats.offline} 
        accent="text-rose-400" 
        glowColor="hover:border-rose-500/40"
        icon="🔴"
        subtext="Attention Needed"
      />
      <StatCard 
        label="Detections (1h)" 
        value={stats.eventsLastHour} 
        accent="text-cyan-400" 
        glowColor="hover:border-cyan-500/40"
        icon="⚡"
        subtext="AI ANPR Ingestion"
      />
      <StatCard 
        label="Active Alerts" 
        value={stats.activeAlerts} 
        accent="text-red-400" 
        glowColor="hover:border-red-500/50"
        icon="🚨"
        subtext="Requires Dispatch"
      />
      <StatCard 
        label="Watchlist" 
        value={stats.watchlistCount} 
        accent="text-amber-300" 
        glowColor="hover:border-amber-500/40"
        icon="🎯"
        subtext="Hotlist Targets"
      />
    </div>
  );
}
