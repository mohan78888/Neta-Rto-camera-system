const prisma = require('../config/prisma');
const watchlistCache = require('./watchlistCache.service');

const SAMPLE_VEHICLES = [
  'GJ01AB1234', // watchlisted (stolen)
  'GJ05XY9988', // watchlisted (blacklisted)
  'GJ27PQ4567', // watchlisted (wanted)
  'GJ18CD3321',
  'GJ12EF7788',
  'GJ09GH4432',
  'MH12KJ9090',
  'RJ14LM2211',
];

let simulatorInterval = null;

async function runDetectionCycle(io) {
  try {
    const cameras = await prisma.camera.findMany({ where: { status: { not: 'OFFLINE' } } });
    if (cameras.length === 0) return;

    const camera = cameras[Math.floor(Math.random() * cameras.length)];
    const vehicleNumber = SAMPLE_VEHICLES[Math.floor(Math.random() * SAMPLE_VEHICLES.length)];
    const confidence = +(0.75 + Math.random() * 0.24).toFixed(2);

    const event = await prisma.event.create({
      data: {
        cameraId: camera.id,
        eventType: 'ANPR',
        vehicleNumber,
        confidence,
        boundingBox: JSON.stringify({
          x: Math.floor(Math.random() * 400),
          y: Math.floor(Math.random() * 200),
          w: 120,
          h: 60,
        }),
      },
      include: { camera: true },
    });

    if (io) io.emit('new_event', event);

    // Ultra-fast O(1) in-memory watchlist correlation (Zero DB delay)
    const match = watchlistCache.match(vehicleNumber);

    if (match) {
      const alert = await prisma.alert.create({
        data: { eventId: event.id, watchlistId: match.id, status: 'NEW' },
        include: { event: { include: { camera: true } }, watchlist: true },
      });
      if (io) io.emit('new_alert', alert);
    }

    // Occasionally flip camera health to simulate real IoT heartbeat variance
    if (Math.random() < 0.08) {
      const statuses = ['ONLINE', 'DEGRADED', 'OFFLINE'];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const updated = await prisma.camera.update({
        where: { id: camera.id },
        data: { status: newStatus, lastHeartbeat: new Date() },
      });
      if (io) io.emit('camera_status', updated);
    } else {
      const updated = await prisma.camera.update({
        where: { id: camera.id },
        data: { lastHeartbeat: new Date() },
      });
      if (io) io.emit('camera_status', updated);
    }
  } catch (err) {
    console.error('Detection cycle error:', err.message);
  }
}

function startSimulator(io, intervalMs = 4000) {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
  }
  simulatorInterval = setInterval(() => runDetectionCycle(io), intervalMs);
  console.log(`[Simulator] AI Detection Cycle running every ${intervalMs}ms`);
  return simulatorInterval;
}

function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[Simulator] Stopped detection cycle');
  }
}

module.exports = {
  startSimulator,
  stopSimulator,
  runDetectionCycle,
};
