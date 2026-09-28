const prisma = require('../config/prisma');
const watchlistCache = require('../services/watchlistCache.service');

async function getEvents(req, res) {
  try {
    const limit = Number(req.query.limit || 50);
    const vehicleNumber = req.query.vehicleNumber;

    const events = await prisma.event.findMany({
      where: vehicleNumber ? { vehicleNumber } : {},
      include: { camera: true },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const body = req.body || {};

    const required = ['camera_id', 'event_type', 'confidence'];
    for (const field of required) {
      if (body[field] === undefined) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }
    if (typeof body.confidence !== 'number' || body.confidence < 0 || body.confidence > 1) {
      return res.status(400).json({ error: 'confidence must be a number between 0 and 1' });
    }

    const camera = await prisma.camera.findFirst({
      where: { OR: [{ id: Number(body.camera_id) || -1 }, { code: String(body.camera_id) }] },
    });
    if (!camera) return res.status(404).json({ error: 'Unknown camera_id' });

    const event = await prisma.event.create({
      data: {
        cameraId: camera.id,
        eventType: body.event_type,
        vehicleNumber: body.vehicle_number || null,
        personId: body.person_id || null,
        confidence: body.confidence,
        boundingBox: body.bounding_box ? JSON.stringify(body.bounding_box) : null,
      },
      include: { camera: true },
    });

    const io = req.app.get('io') || global.__io;
    if (io) io.emit('new_event', event);

    let alert = null;
    const identifier = body.vehicle_number || body.person_id;
    if (identifier) {
      // O(1) in-memory hotlist lookup
      const match = watchlistCache.match(identifier);
      if (match) {
        alert = await prisma.alert.create({
          data: { eventId: event.id, watchlistId: match.id, status: 'NEW' },
          include: { event: { include: { camera: true } }, watchlist: true },
        });
        if (io) io.emit('new_alert', alert);
      }
    }

    return res.status(201).json({ event, alert });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to ingest event', details: error.message });
  }
}

module.exports = {
  getEvents,
  createEvent,
};
