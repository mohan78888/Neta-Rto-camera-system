'use client';
import { useState, useRef, useEffect } from 'react';

const STATUS_STYLE = {
  ONLINE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
  DEGRADED: 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  OFFLINE: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
};

const VISION_MODES = [
  { id: 'normal', name: 'OPTICAL', icon: '👁️', className: '' },
  { id: 'night', name: 'NIGHT IR', icon: '🟢', className: 'cctv-filter-night' },
  { id: 'thermal', name: 'FLIR THERMAL', icon: '🔥', className: 'cctv-filter-thermal' },
  { id: 'mono', name: 'MONO B&W', icon: '📼', className: 'cctv-filter-mono' },
];

// Safe CCTV Video Player Component
function CCTVPlayer({ src, className, filterClass = '', zoom = 1, panX = 0, panY = 0, controls = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== 'AbortError') {
          // Benign error swallow
        }
      });
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      controls={controls}
      preload="metadata"
      style={{
        transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-out',
      }}
      className={`${className} ${filterClass}`}
      onError={(e) => {
        const errCode = e.target?.error?.code;
        if (errCode === 1) return;
        if (errCode === 4) {
          e.currentTarget.style.display = 'none';
        }
      }}
    />
  );
}

export default function CameraGrid({ cameras = [] }) {
  const safeCameras = Array.isArray(cameras) ? cameras : [];
  
  // UI State
  const [selectedCam, setSelectedCam] = useState(null);
  const [layout, setLayout] = useState('2x2'); // '1x1', '2x2', 'dense'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [aiOverlayEnabled, setAiOverlayEnabled] = useState(true);
  const [visionMode, setVisionMode] = useState('normal');
  const [snapshotToast, setSnapshotToast] = useState(null);

  // PTZ State for Modal
  const [ptzZoom, setPtzZoom] = useState(1);
  const [ptzPanX, setPtzPanX] = useState(0);
  const [ptzPanY, setPtzPanY] = useState(0);
  const [audioListening, setAudioListening] = useState(false);
  const [intercomActive, setIntercomActive] = useState(false);

  // Unique Zones list
  const zones = ['ALL', ...Array.from(new Set(safeCameras.map((c) => c.zone).filter(Boolean)))];

  // Filtered cameras
  const filteredCameras = safeCameras.filter((cam) => {
    const matchStatus = statusFilter === 'ALL' || cam.status === statusFilter;
    const matchZone = selectedZone === 'ALL' || cam.zone === selectedZone;
    return matchStatus && matchZone;
  });

  // PTZ Control Handlers
  function handlePan(dx, dy) {
    setPtzPanX((prev) => Math.max(-100, Math.min(100, prev + dx)));
    setPtzPanY((prev) => Math.max(-100, Math.min(100, prev + dy)));
  }

  function handleZoom(delta) {
    setPtzZoom((prev) => Math.max(1, Math.min(3, +(prev + delta).toFixed(1))));
  }

  function resetPTZ() {
    setPtzZoom(1);
    setPtzPanX(0);
    setPtzPanY(0);
  }

  // Snapshot Capture
  function captureSnapshot(cam) {
    const filename = `${cam.code}_SNAPSHOT_${Date.now()}.jpg`;
    setSnapshotToast(`Snapshot captured: ${filename} (Saved to Police Evidence Store)`);
    setTimeout(() => setSnapshotToast(null), 3500);
  }

  if (safeCameras.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-slate-400 text-sm">
        No cameras active in the registry.
      </div>
    );
  }

  const currentVisionFilter = VISION_MODES.find((m) => m.id === visionMode)?.className || '';

  // Grid layout class mapping
  const gridClasses = {
    '1x1': 'grid grid-cols-1 gap-4 max-w-4xl mx-auto',
    '2x2': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5',
    'dense': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2',
  }[layout] || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5';

  return (
    <>
      {/* Toast Notification */}
      {snapshotToast && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-emerald-500/90 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-white/20 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>📸</span>
          <span>{snapshotToast}</span>
        </div>
      )}

      {/* CCTV Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        {/* Left: Status & Zone Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Zone Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-400"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === 'ALL' ? 'All Zones' : z}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Layout Switcher, Vision Mode & AI Overlay Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Bounding Box Toggle */}
          <button
            onClick={() => setAiOverlayEnabled(!aiOverlayEnabled)}
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
              aiOverlayEnabled
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/70 border-slate-800 text-slate-500'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${aiOverlayEnabled ? 'bg-emerald-400 live-dot' : 'bg-slate-600'}`} />
            AI DETECTIONS: {aiOverlayEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Vision Sensor Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            {VISION_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setVisionMode(mode.id)}
                title={mode.name}
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  visionMode === mode.id
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{mode.icon}</span>
                <span className="hidden md:inline">{mode.name}</span>
              </button>
            ))}
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLayout('1x1')}
              title="1x1 Single Focus"
              className={`p-1 rounded text-xs transition-all ${
                layout === '1x1' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⬛
            </button>
            <button
              onClick={() => setLayout('2x2')}
              title="2x2 Quad Grid"
              className={`p-1 rounded text-xs transition-all ${
                layout === '2x2' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setLayout('dense')}
              title="Matrix View"
              className={`p-1 rounded text-xs transition-all ${
                layout === 'dense' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      {/* Camera Video Grid */}
      <div className={gridClasses}>
        {filteredCameras.map((cam) => (
          <div
            key={cam.id}
            onClick={() => {
              setSelectedCam(cam);
              resetPTZ();
            }}
            className="glass-panel rounded-xl overflow-hidden group hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-200 cursor-pointer relative flex flex-col justify-between"
          >
            {/* Video Container with HUD */}
            <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              {/* CRT Scanline */}
              <div className="absolute inset-0 cctv-scanline z-10 opacity-70 group-hover:opacity-40 transition-opacity" />

              {/* REC / LIVE Indicator */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] font-mono tracking-widest text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'ONLINE' ? 'bg-red-500 live-dot' : 'bg-slate-500'}`} />
                {cam.status === 'ONLINE' ? 'REC · LIVE' : 'OFFLINE'}
              </div>

              {/* Status Pill */}
              <span className={`absolute top-2 right-2 z-20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLE[cam.status] || STATUS_STYLE.OFFLINE}`}>
                {cam.status}
              </span>

              {/* Simultaneous Multi-Target AI Detection Overlay */}
              {aiOverlayEnabled && cam.status === 'ONLINE' && (
                <div className="absolute inset-0 z-20 pointer-events-none p-3 flex flex-col justify-between">
                  {/* Target A: Stolen Match */}
                  <div className="self-start ml-2 mt-4 border border-rose-500/90 bg-rose-500/15 rounded w-24 h-12 relative animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    <span className="absolute -top-3 left-0 text-[7px] font-mono font-black bg-rose-600 text-white px-1 rounded flex items-center gap-0.5">
                      <span>🚨</span> T1: STOLEN
                    </span>
                    <span className="absolute -bottom-3 right-0 text-[7px] font-mono font-bold text-rose-300 bg-black/90 px-1 rounded border border-rose-500/40">
                      GJ01AB1234
                    </span>
                  </div>

                  {/* Target B: Blacklisted / Clear Traffic */}
                  <div className="self-end mr-4 mb-3 border border-amber-400/90 bg-amber-500/15 rounded w-20 h-10 relative">
                    <span className="absolute -top-3 left-0 text-[7px] font-mono font-bold bg-amber-600 text-slate-950 px-1 rounded">
                      T2: ANPR 91%
                    </span>
                    <span className="absolute -bottom-3 right-0 text-[7px] font-mono text-amber-300 bg-black/90 px-1 rounded border border-amber-500/40">
                      GJ05XY9988
                    </span>
                  </div>
                </div>
              )}

              {/* Video Player */}
              <CCTVPlayer
                src={cam.streamRef}
                filterClass={currentVisionFilter}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
              />

              {/* Bottom HUD Bar */}
              <div className="absolute bottom-1.5 left-2 right-2 z-20 flex justify-between items-center text-[9px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
                <span className="truncate text-cyan-300">1080p · 25 FPS · 4.2M</span>
                <span className="font-semibold text-amber-300">{cam.code}</span>
              </div>
            </div>

            {/* Camera Info Footer */}
            <div className="p-2.5 bg-slate-900/70 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                  {cam.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 font-semibold">
                  {cam.code}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
                <span>{cam.zone} · {cam.department}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      captureSnapshot(cam);
                    }}
                    title="Capture Snapshot"
                    className="text-[11px] text-slate-400 hover:text-amber-300 p-0.5"
                  >
                    📸
                  </button>
                  <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 font-semibold">
                    Expand ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Interactive Surveillance Console Modal */}
      {selectedCam && (
        <div
          onClick={() => setSelectedCam(null)}
          className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl glass-panel-glow rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl relative flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📹</span>
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{selectedCam.name}</span>
                    <span className="font-mono text-xs text-amber-300 px-2 py-0.5 rounded bg-slate-800">
                      {selectedCam.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[selectedCam.status] || STATUS_STYLE.OFFLINE}`}>
                      {selectedCam.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedCam.department} · {selectedCam.zone} · Protocol: {selectedCam.sourceProtocol} · Stream: {selectedCam.streamRef}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => captureSnapshot(selectedCam)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>📸</span>
                  <span>Capture Evidence</span>
                </button>
                <button
                  onClick={() => setSelectedCam(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Main Viewport & PTZ Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 bg-black">
              {/* Video Player */}
              <div className="lg:col-span-3 aspect-video relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />
                <div className="hud-corner-bl" />
                <div className="hud-corner-br" />
                <div className="absolute inset-0 cctv-scanline pointer-events-none opacity-40 z-10" />

                <CCTVPlayer
                  src={selectedCam.streamRef}
                  controls={false}
                  filterClass={currentVisionFilter}
                  zoom={ptzZoom}
                  panX={ptzPanX}
                  panY={ptzPanY}
                  className="w-full h-full object-cover"
                />

                {/* Simultaneous Multi-Target AI Detection Bounding Boxes in Modal */}
                {aiOverlayEnabled && (
                  <div className="absolute inset-0 z-20 pointer-events-none p-8 flex flex-col justify-between">
                    {/* Target 1: Critical Stolen */}
                    <div className="self-start ml-4 mt-6 border-2 border-rose-500 bg-rose-500/15 rounded-lg w-48 h-28 relative shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
                      <span className="absolute -top-4 left-0 text-[9px] font-mono font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <span>🚨</span> TARGET 1: STOLEN (ANPR 96%)
                      </span>
                      <span className="absolute -bottom-4 right-0 text-[10px] font-mono font-bold text-rose-300 bg-black/90 px-2 py-0.5 rounded border border-rose-500/50">
                        GJ01AB1234
                      </span>
                    </div>

                    {/* Target 2: Blacklisted Convoy Target */}
                    <div className="self-end mr-8 mb-6 border-2 border-amber-400 bg-amber-500/15 rounded-lg w-40 h-22 relative shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <span className="absolute -top-4 left-0 text-[9px] font-mono font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <span>⚠️</span> TARGET 2: BLACKLISTED
                      </span>
                      <span className="absolute -bottom-4 right-0 text-[10px] font-mono font-bold text-amber-300 bg-black/90 px-2 py-0.5 rounded border border-amber-500/50">
                        GJ05XY9988
                      </span>
                    </div>
                  </div>
                )}

                {/* Telemetry HUD */}
                <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 live-dot" />
                    <span className="text-red-400 font-bold">LIVE SURVEILLANCE FEED</span>
                    <span className="text-slate-400">| SENSOR: {VISION_MODES.find((m) => m.id === visionMode)?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    LAT: {selectedCam.latitude} | LNG: {selectedCam.longitude} | PTZ: ZOOM {ptzZoom}x (X:{ptzPanX}, Y:{ptzPanY})
                  </div>
                  <div className="text-[11px] text-cyan-300 font-bold">
                    HEARTBEAT: OK (0.04s) · BITRATE: 4.8 Mbps · CODEC: H.264
                  </div>
                </div>
              </div>

              {/* PTZ & Surveillance Command Console Sidebar */}
              <div className="p-4 bg-slate-950 flex flex-col justify-between space-y-4 text-xs font-mono">
                {/* PTZ D-Pad Controls */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">PTZ Controls</span>
                    <button
                      onClick={resetPTZ}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                    >
                      Reset Pan/Zoom
                    </button>
                  </div>

                  {/* Virtual D-Pad */}
                  <div className="flex flex-col items-center gap-1 py-1">
                    <button
                      onClick={() => handlePan(0, 15)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                      ▲
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePan(15, 0)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold flex items-center justify-center transition-colors"
                      >
                        ◀
                      </button>
                      <span className="text-[9px] text-slate-500 font-bold">PTZ</span>
                      <button
                        onClick={() => handlePan(-15, 0)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold flex items-center justify-center transition-colors"
                      >
                        ▶
                      </button>
                    </div>
                    <button
                      onClick={() => handlePan(0, -15)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold flex items-center justify-center transition-colors"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Digital Zoom</span>
                      <span className="text-amber-400 font-bold">{ptzZoom}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleZoom(-0.2)}
                        disabled={ptzZoom <= 1}
                        className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleZoom(0.2)}
                        disabled={ptzZoom >= 3}
                        className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vision Modes Toggle in Modal */}
                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  <span className="font-bold text-slate-300 text-[10px] uppercase">Sensor Filter</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VISION_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setVisionMode(m.id)}
                        className={`py-1 px-2 rounded text-[10px] font-bold border flex items-center justify-center gap-1 ${
                          visionMode === m.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Intercom Simulator */}
                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  <span className="font-bold text-slate-300 text-[10px] uppercase">Junction Intercom</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAudioListening(!audioListening)}
                      className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold border transition-all ${
                        audioListening
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {audioListening ? '🔊 Mic Live' : '🔇 Audio Muted'}
                    </button>
                    <button
                      onClick={() => setIntercomActive(!intercomActive)}
                      className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold border transition-all ${
                        intercomActive
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {intercomActive ? '🚨 Siren Cast' : '📢 Siren Alert'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>RTSP Endpoint: <code className="text-amber-300 font-mono">{selectedCam.streamRef}</code></span>
              <button
                onClick={() => setSelectedCam(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Close Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
