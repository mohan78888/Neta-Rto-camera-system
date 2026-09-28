const prisma = require('../config/prisma');

async function getAlerts(req, res) {
  try {
    const status = req.query.status;

    const alerts = await prisma.alert.findMany({
      where: status ? { status } : {},
      include: { event: { include: { camera: true } }, watchlist: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
  }
}

async function updateAlert(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid alert ID' });

    const body = req.body || {};
    if (!body.status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: { event: { include: { camera: true } }, watchlist: true },
    });

    const io = req.app.get('io') || global.__io;
    if (io) io.emit('alert_updated', alert);

    return res.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return res.status(500).json({ error: 'Failed to update alert', details: error.message });
  }
}

module.exports = {
  getAlerts,
  updateAlert,
};
