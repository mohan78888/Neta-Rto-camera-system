const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlist.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', watchlistController.getWatchlist);
router.post('/', requireAuth, watchlistController.createWatchlistEntry);
router.patch('/:id', requireAuth, watchlistController.updateWatchlistEntry);

module.exports = router;
