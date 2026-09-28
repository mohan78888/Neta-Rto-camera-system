'use client';

export default function EventFeed({ events = [] }) {
  const safeEvents = Array.isArray(events) ? events : [];

  if (safeEvents.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center text-slate-400 text-xs">
        <span className="text-xl block mb-1">📡</span>
        Awaiting live AI inference events...
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
      {safeEvents.map((e) => (
        <div 
          key={e.id} 
          className="glass-panel rounded-xl p-3 flex items-center justify-between gap-2 hover:border-slate-700/80 transition-all duration-150"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-amber-300 tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {e.vehicleNumber || e.personId || 'UNIDENTIFIED'}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                {e.eventType || 'ANPR'}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Cam:</span>
              <span className="font-semibold text-slate-200">
                {e.camera?.code || 'C000'}
              </span>
              <span>•</span>
              <span className="truncate text-slate-400">
                {e.camera?.name || 'Junction Feed'}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] font-mono font-bold text-emerald-400">
              {e.confidence ? `${(e.confidence * 100).toFixed(0)}%` : '95%'}
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
