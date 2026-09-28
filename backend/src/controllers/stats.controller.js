const prisma = require('../config/prisma');

async function getPlatformStats(req, res) {
  try {
    const [totalCameras, online, offline, degraded, totalEvents, activeAlerts, watchlistCount] = await Promise.all([
      prisma.camera.count(),
      prisma.camera.count({ where: { status: 'ONLINE' } }),
      prisma.camera.count({ where: { status: 'OFFLINE' } }),
      prisma.camera.count({ where: { status: 'DEGRADED' } }),
      prisma.event.count(),
      prisma.alert.count({ where: { status: 'NEW' } }),
      prisma.watchlistEntry.count({ where: { active: true } }),
    ]);

    const eventsLastHour = await prisma.event.count({
      where: { timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    return res.json({
      totalCameras,
      online,
      offline,
      degraded,
      totalEvents,
      eventsLastHour,
      activeAlerts,
      watchlistCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch platform stats', details: error.message });
  }
}

module.exports = {
  getPlatformStats,
};
