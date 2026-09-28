const prisma = require('../config/prisma');

async function getVehicleRouteHistory(req, res) {
  try {
    const rawNumber = req.params.number || '';
    const vehicleNumber = decodeURIComponent(rawNumber).toUpperCase().trim();

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const events = await prisma.event.findMany({
      where: { vehicleNumber },
      include: { camera: true },
      orderBy: { timestamp: 'asc' },
    });

    const watchlistEntry = await prisma.watchlistEntry.findFirst({
      where: { identifier: vehicleNumber },
    });

    const alerts = await prisma.alert.findMany({
      where: { event: { vehicleNumber } },
      include: { event: { include: { camera: true } }, watchlist: true },
    });

    // Haversine formula to compute distance between two GIS coordinates in kilometers
    function getDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const route = events.map((e, idx) => {
      let speedKmH = null;
      let distanceKm = null;
      let isSpeedViolation = false;

      if (idx > 0 && e.camera && events[idx - 1].camera) {
        const prev = events[idx - 1];
        const dist = getDistanceKm(
          prev.camera.latitude,
          prev.camera.longitude,
          e.camera.latitude,
          e.camera.longitude
        );
        const timeDiffHours = (new Date(e.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);

        if (timeDiffHours > 0.001 && dist > 0.05) {
          const rawSpeed = dist / timeDiffHours;
          speedKmH = Math.round(rawSpeed);
          distanceKm = +dist.toFixed(2);
          if (speedKmH > 80) {
            isSpeedViolation = true;
          }
        }
      }

      return {
        camera: e.camera ? e.camera.name : 'Unknown',
        code: e.camera ? e.camera.code : 'UNKNOWN',
        lat: e.camera ? e.camera.latitude : 0,
        lng: e.camera ? e.camera.longitude : 0,
        timestamp: e.timestamp,
        confidence: e.confidence,
        speedKmH,
        distanceKm,
        isSpeedViolation,
      };
    });

    return res.json({ vehicleNumber, watchlistEntry, events, alerts, route });
  } catch (error) {
    console.error('Error fetching vehicle route history:', error);
    return res.status(500).json({ error: 'Failed to reconstruct route', details: error.message });
  }
}

module.exports = {
  getVehicleRouteHistory,
};
