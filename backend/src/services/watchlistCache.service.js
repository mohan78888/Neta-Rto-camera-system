const prisma = require('../config/prisma');

// Ultra-fast in-memory O(1) Cache for Watchlist Entries
// Eliminates repetitive DB queries for every high-frequency CCTV AI detection event.
class WatchlistCacheService {
  constructor() {
    this.cache = new Map(); // identifier.toUpperCase() -> entry
    this.lastRefreshed = null;
    this.isInitialized = false;
  }

  async init() {
    await this.refresh();
  }

  async refresh() {
    try {
      const activeEntries = await prisma.watchlistEntry.findMany({
        where: { active: true },
      });

      this.cache.clear();
      for (const entry of activeEntries) {
        if (entry.identifier) {
          this.cache.set(entry.identifier.toUpperCase().trim(), entry);
        }
      }

      this.lastRefreshed = new Date();
      this.isInitialized = true;
      console.log(`[WatchlistCache] In-memory cache loaded ${this.cache.size} active target(s) [O(1) lookup ready]`);
    } catch (err) {
      console.error('[WatchlistCache] Error refreshing cache:', err.message);
    }
  }

  // O(1) in-memory lookup
  match(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toUpperCase().trim();
    return this.cache.get(cleanId) || null;
  }

  size() {
    return this.cache.size;
  }
}

const watchlistCache = new WatchlistCacheService();

module.exports = watchlistCache;
