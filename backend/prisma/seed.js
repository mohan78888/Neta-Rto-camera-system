const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@netra.gov.in' },
    update: {},
    create: { name: 'Netra Admin', email: 'admin@netra.gov.in', password: passHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'operator@netra.gov.in' },
    update: {},
    create: { name: 'Netra Operator', email: 'operator@netra.gov.in', password: passHash, role: 'OPERATOR' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@okdriver.in' },
    update: {},
    create: { name: 'Admin', email: 'admin@okdriver.in', password: passHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'operator@okdriver.in' },
    update: {},
    create: { name: 'Operator', email: 'operator@okdriver.in', password: passHash, role: 'OPERATOR' },
  });

  const cameras = [
    { code: 'C001', name: 'Ahmedabad Traffic Junction', department: 'Traffic Police', latitude: 23.0225, longitude: 72.5714, cameraType: 'Fixed ANPR', sourceProtocol: 'SIMULATED', streamRef: '/sample-feeds/traffic1.mp4', zone: 'Zone A', status: 'ONLINE' },
    { code: 'C002', name: 'RTO Checkpoint Naroda', department: 'RTO', latitude: 23.0731, longitude: 72.6570, cameraType: 'PTZ', sourceProtocol: 'SIMULATED', streamRef: '/sample-feeds/rto1.mp4', zone: 'Zone B', status: 'ONLINE' },
    { code: 'C003', name: 'SG Highway Toll', department: 'Highway Authority', latitude: 23.0395, longitude: 72.5066, cameraType: 'Fixed ANPR', sourceProtocol: 'SIMULATED', streamRef: '/sample-feeds/toll1.mp4', zone: 'Zone C', status: 'DEGRADED' },
    { code: 'C004', name: 'Maninagar Police Station', department: 'City Police', latitude: 23.0058, longitude: 72.6017, cameraType: 'Fixed', sourceProtocol: 'SIMULATED', streamRef: '/sample-feeds/station1.mp4', zone: 'Zone A', status: 'OFFLINE' },
  ];

  for (const c of cameras) {
    await prisma.camera.upsert({ where: { code: c.code }, update: {}, create: { ...c, lastHeartbeat: new Date() } });
  }

  const watchlist = [
    { entityType: 'VEHICLE', identifier: 'GJ01AB1234', reason: 'Reported Stolen', severity: 'CRITICAL' },
    { entityType: 'VEHICLE', identifier: 'GJ05XY9988', reason: 'Blacklisted - Toll Evasion', severity: 'MEDIUM' },
    { entityType: 'VEHICLE', identifier: 'GJ27PQ4567', reason: 'Wanted - Court Order', severity: 'HIGH' },
    { entityType: 'PERSON', identifier: 'P-10023', reason: 'Missing Person Report', severity: 'HIGH' },
  ];

  for (const w of watchlist) {
    const existing = await prisma.watchlistEntry.findFirst({ where: { identifier: w.identifier } });
    if (!existing) await prisma.watchlistEntry.create({ data: w });
  }

  console.log('Seed complete. Login: admin@okdriver.in / operator@okdriver.in, password: password123');
}

main().finally(() => prisma.$disconnect());
