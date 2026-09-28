const prisma = require('../config/prisma');

async function getCameras(req, res) {
  try {
    const { q, status, zone } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { department: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (zone) where.zone = zone;

    const cameras = await prisma.camera.findMany({ where, orderBy: { code: 'asc' } });
    return res.json(cameras);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return res.status(500).json({ error: 'Failed to fetch cameras', details: error.message });
  }
}

async function getCameraById(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid camera ID' });

    const camera = await prisma.camera.findUnique({
      where: { id },
      include: { auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!camera) return res.status(404).json({ error: 'Not found' });
    return res.json(camera);
  } catch (error) {
    console.error('Error fetching camera:', error);
    return res.status(500).json({ error: 'Failed to fetch camera', details: error.message });
  }
}

async function createCamera(req, res) {
  try {
    const user = req.user;
    const body = req.body || {};
    const required = ['code', 'name', 'department', 'latitude', 'longitude', 'cameraType', 'sourceProtocol', 'streamRef', 'zone'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === '') {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    const camera = await prisma.camera.create({
      data: {
        code: body.code,
        name: body.name,
        department: body.department,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        cameraType: body.cameraType,
        sourceProtocol: body.sourceProtocol,
        streamRef: body.streamRef,
        zone: body.zone,
        status: body.status || 'OFFLINE',
        lastHeartbeat: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { action: 'CAMERA_CREATED', detail: `${user.email} added camera ${camera.code}`, cameraId: camera.id },
    });

    const io = req.app.get('io') || global.__io;
    if (io) io.emit('camera_status', camera);

    return res.status(201).json(camera);
  } catch (error) {
    console.error('Error creating camera:', error);
    return res.status(500).json({ error: 'Failed to create camera', details: error.message });
  }
}

async function updateCamera(req, res) {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid camera ID' });

    const body = req.body || {};

    const camera = await prisma.camera.update({
      where: { id },
      data: {
        ...('name' in body && { name: body.name }),
        ...('department' in body && { department: body.department }),
        ...('latitude' in body && { latitude: parseFloat(body.latitude) }),
        ...('longitude' in body && { longitude: parseFloat(body.longitude) }),
        ...('cameraType' in body && { cameraType: body.cameraType }),
        ...('sourceProtocol' in body && { sourceProtocol: body.sourceProtocol }),
        ...('streamRef' in body && { streamRef: body.streamRef }),
        ...('zone' in body && { zone: body.zone }),
        ...('status' in body && { status: body.status }),
      },
    });

    await prisma.auditLog.create({
      data: { action: 'CAMERA_UPDATED', detail: `${user.email} updated camera ${camera.code}`, cameraId: camera.id },
    });

    const io = req.app.get('io') || global.__io;
    if (io) io.emit('camera_status', camera);

    return res.json(camera);
  } catch (error) {
    console.error('Error updating camera:', error);
    return res.status(500).json({ error: 'Failed to update camera', details: error.message });
  }
}

async function deleteCamera(req, res) {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid camera ID' });

    const camera = await prisma.camera.update({ where: { id }, data: { status: 'OFFLINE' } });

    await prisma.auditLog.create({
      data: { action: 'CAMERA_DISABLED', detail: `${user.email} disabled camera ${camera.code}`, cameraId: camera.id },
    });

    const io = req.app.get('io') || global.__io;
    if (io) io.emit('camera_status', camera);

    return res.json({ ok: true, camera });
  } catch (error) {
    console.error('Error disabling camera:', error);
    return res.status(500).json({ error: 'Failed to disable camera', details: error.message });
  }
}

module.exports = {
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
};
