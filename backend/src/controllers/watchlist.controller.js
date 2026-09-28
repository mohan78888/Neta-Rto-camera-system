const prisma = require('../config/prisma');
const watchlistCache = require('../services/watchlistCache.service');

async function getWatchlist(req, res) {
  try {
    const list = await prisma.watchlistEntry.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(list);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return res.status(500).json({ error: 'Failed to fetch watchlist', details: error.message });
  }
}

async function createWatchlistEntry(req, res) {
  try {
    const body = req.body || {};
    if (!body.identifier || !body.entityType || !body.reason) {
      return res.status(400).json({ error: 'identifier, entityType and reason are required' });
    }

    const entry = await prisma.watchlistEntry.create({
      data: {
        entityType: body.entityType,
        identifier: body.identifier.toUpperCase().trim(),
        reason: body.reason,
        severity: body.severity || 'HIGH',
      },
    });

    // Invalidate and refresh in-memory cache instantly
    await watchlistCache.refresh();

    return res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating watchlist entry:', error);
    return res.status(500).json({ error: 'Failed to create watchlist entry', details: error.message });
  }
}

async function updateWatchlistEntry(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid watchlist ID' });

    const body = req.body || {};
    const entry = await prisma.watchlistEntry.update({
      where: { id },
      data: { ...('active' in body && { active: body.active }) },
    });

    // Invalidate and refresh in-memory cache instantly
    await watchlistCache.refresh();

    return res.json(entry);
  } catch (error) {
    console.error('Error updating watchlist entry:', error);
    return res.status(500).json({ error: 'Failed to update watchlist entry', details: error.message });
  }
}

module.exports = {
  getWatchlist,
  createWatchlistEntry,
  updateWatchlistEntry,
};
