const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const cameraRoutes = require('./camera.routes');
const eventRoutes = require('./event.routes');
const alertRoutes = require('./alert.routes');
const watchlistRoutes = require('./watchlist.routes');
const vehicleRoutes = require('./vehicle.routes');
const statsRoutes = require('./stats.routes');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'okdriver-backend',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/cameras', cameraRoutes);
router.use('/events', eventRoutes);
router.use('/alerts', alertRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/vehicle', vehicleRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
