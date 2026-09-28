'use client';

const SEVERITY_CONFIG = {
  CRITICAL: {
    border: 'border-l-rose-500 bg-rose-500/10 border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: '🚨',
  },
  HIGH: {
    border: 'border-l-amber-500 bg-amber-500/10 border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: '⚠️',
  },
  MEDIUM: {
    border: 'border-l-orange-500 bg-orange-500/10 border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    icon: '⚡',
  },
  LOW: {
    border: 'border-l-slate-500 bg-slate-500/10 border-slate-500/30',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    icon: 'ℹ️',
  },
};

export default function AlertFeed({ alerts = [], onUpdateStatus }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  if (safeAlerts.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center text-slate-400 text-xs">
        <span className="text-xl block mb-1">🛡️</span>
        No active watchlist alerts. Monitoring live telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
      {safeAlerts.map((alert) => {
        const severity = alert.watchlist?.severity || 'HIGH';
        const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.HIGH;
        const isNew = alert.status === 'NEW';

        return (
          <div
            key={alert.id}
            className={`border-l-4 border rounded-xl p-3.5 backdrop-blur-md transition-all duration-200 ${config.border} ${
              isNew ? 'alert-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'opacity-90'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <span className="font-black text-sm font-mono tracking-wide text-white">
                    {alert.watchlist?.identifier || 'UNKNOWN'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${config.badge}`}>
                    {severity}
                  </span>
                </div>

                <div className="text-xs font-semibold text-amber-200/90 mt-1">
                  Reason: {alert.watchlist?.reason}
                </div>

                <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-slate-400">Cam:</span>
                  <span className="font-semibold text-slate-200">
                    {alert.event?.camera?.name || 'Camera'} ({alert.event?.camera?.code || '—'})
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {alert.event?.confidence ? `${(alert.event.confidence * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(alert.createdAt).toLocaleTimeString()} · {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>

              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                alert.status === 'NEW' 
                  ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                  : alert.status === 'ACKNOWLEDGED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              }`}>
                {alert.status}
              </span>
            </div>

            {alert.status !== 'RESOLVED' && (
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-white/5">
                {alert.status === 'NEW' && (
                  <button
                    onClick={() => onUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => onUpdateStatus(alert.id, 'RESOLVED')}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
