'use client';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';

const STATUS_COLOR = { 
  ONLINE: '#10b981', 
  DEGRADED: '#f59e0b', 
  OFFLINE: '#ef4444' 
};

const ROUTE_PALETTE = ['#ef4444', '#06b6d4', '#a855f7', '#f59e0b', '#10b981'];

export default function CameraMap({ 
  cameras = [], 
  route = [], 
  multiRoutes = [], 
  center = [23.03, 72.58], 
  zoom = 11, 
  height = '430px' 
}) {
  const safeCameras = Array.isArray(cameras) ? cameras : [];

  // Normalize multiRoutes format
  let allRoutes = [];
  if (Array.isArray(multiRoutes) && multiRoutes.length > 0) {
    allRoutes = multiRoutes;
  } else if (Array.isArray(route) && route.length > 0) {
    allRoutes = [{ id: 'Target 1', label: 'Primary Target', color: '#ef4444', route }];
  }

  // Find common crossing cameras across multiple targets (Convoy / Intersection detection)
  const cameraVisitCounts = {};
  allRoutes.forEach((rObj) => {
    const visitedInThisRoute = new Set();
    (rObj.route || []).forEach((stop) => {
      if (stop.code && !visitedInThisRoute.has(stop.code)) {
        visitedInThisRoute.add(stop.code);
        cameraVisitCounts[stop.code] = (cameraVisitCounts[stop.code] || 0) + 1;
      }
    });
  });

  const intersectionCameraCodes = Object.keys(cameraVisitCounts).filter(
    (code) => cameraVisitCounts[code] > 1 && allRoutes.length > 1
  );

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden glass-panel border border-slate-800/80 shadow-2xl relative">
      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-slate-300 flex items-center gap-1.5 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
          GIS VECTOR GRID: OPENSTREETMAP
        </span>

        {allRoutes.length > 1 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-rose-500/20 backdrop-blur-md border border-rose-500/50 text-rose-300 flex items-center gap-1.5 shadow-lg">
            <span>🎯</span>
            MULTI-TARGET SURVEILLANCE ({allRoutes.length} TARGETS)
          </span>
        )}

        {intersectionCameraCodes.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-300 flex items-center gap-1.5 shadow-lg animate-pulse">
            <span>⚠️</span>
            {intersectionCameraCodes.length} CONVOY CROSSING POINT(S) DETECTED
          </span>
        )}
      </div>

      {/* Multi-Target Color Legend Overlay */}
      {allRoutes.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[400] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] font-mono space-y-1 shadow-lg pointer-events-auto">
          <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Target Legend:</div>
          {allRoutes.map((rObj, idx) => {
            const color = rObj.color || ROUTE_PALETTE[idx % ROUTE_PALETTE.length];
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded" style={{ backgroundColor: color }} />
                <span className="text-slate-200 font-bold">{rObj.label || rObj.id}</span>
                <span className="text-slate-500">({(rObj.route || []).length} stops)</span>
              </div>
            );
          })}
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#07090e' }} 
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Camera Nodes */}
        {safeCameras.map((cam) => {
          const isIntersection = intersectionCameraCodes.includes(cam.code);
          const color = isIntersection ? '#f59e0b' : (STATUS_COLOR[cam.status] || '#94a3b8');

          return (
            <CircleMarker
              key={cam.id}
              center={[cam.latitude, cam.longitude]}
              radius={isIntersection ? 11 : 8}
              pathOptions={{
                color: isIntersection ? '#fbbf24' : color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isIntersection ? 3 : 2,
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="font-extrabold text-xs flex items-center justify-between gap-2">
                    <span>{cam.code}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200">
                      {cam.status}
                    </span>
                  </div>
                  <div className="font-semibold text-xs mt-0.5">{cam.name}</div>
                  <div className="text-[11px] text-slate-600 mt-1">{cam.department} · {cam.zone}</div>
                  {isIntersection && (
                    <div className="mt-1 px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-800">
                      ⚠️ Common Convoy Crossing Point
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Protocol: {cam.sourceProtocol}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Multi-Target Route Polylines and Stop Pins */}
        {allRoutes.map((rObj, rIdx) => {
          const routeColor = rObj.color || ROUTE_PALETTE[rIdx % ROUTE_PALETTE.length];
          const stops = rObj.route || [];

          return (
            <div key={`route-group-${rIdx}`}>
              {/* Polyline */}
              {stops.length > 1 && (
                <Polyline 
                  positions={stops.map((r) => [r.lat, r.lng])} 
                  pathOptions={{ 
                    color: routeColor, 
                    weight: 3.5, 
                    dashArray: rIdx === 0 ? '6, 8' : '4, 6',
                    opacity: 0.95 
                  }} 
                />
              )}

              {/* Stop Markers */}
              {stops.map((r, i) => (
                <CircleMarker 
                  key={`stop-${rIdx}-${i}`} 
                  center={[r.lat, r.lng]} 
                  radius={6} 
                  pathOptions={{ 
                    color: '#ffffff', 
                    fillColor: routeColor, 
                    fillOpacity: 1,
                    weight: 1.5 
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="font-black text-xs uppercase" style={{ color: routeColor }}>
                        {rObj.label || rObj.id} · Stop #{i + 1}
                      </div>
                      <div className="font-bold text-xs mt-0.5">{r.camera} ({r.code})</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Time: {new Date(r.timestamp).toLocaleTimeString()}
                      </div>
                      {r.speedKmH && (
                        <div className="text-[10px] font-mono font-bold text-slate-700">
                          Speed: {r.speedKmH} km/h
                        </div>
                      )}
                      <div className="text-[10px] font-mono font-bold text-emerald-600">
                        AI Confidence: {(r.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
