require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const compression = require('compression');
const apiRoutes = require('./routes');
const { startSimulator, stopSimulator } = require('./services/simulator.service');
const watchlistCache = require('./services/watchlistCache.service');

const app = express();
const port = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Performance Optimization: HTTP Compression (gzip/deflate for 70%+ payload shrink)
app.use(compression());

// CORS configuration for REST & credentials (cookies)
app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create HTTP server
const httpServer = http.createServer(app);

// Mount Socket.IO on /api/socket for real-time alerts & events
const io = new Server(httpServer, {
  path: '/api/socket',
  cors: {
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Provide io to controllers and global reference
app.set('io', io);
global.__io = io;

// Mount REST API endpoints
app.use('/api', apiRoutes);

// Root greeting / health
app.get('/', (req, res) => {
  res.json({
    service: 'Netra CCTV Platform Backend API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start listening
httpServer.listen(port, () => {
  console.log(`====================================================`);
  console.log(`Netra CCTV Express Backend running on http://localhost:${port}`);
  console.log(`Socket.IO real-time gateway mounted at /api/socket`);
  console.log(`====================================================`);

  // Warm up in-memory O(1) watchlist cache
  watchlistCache.init().then(() => {
    // Start the automated CCTV AI detection cycle
    startSimulator(io, 4000);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  stopSimulator();
  httpServer.close(() => {
    console.log('HTTP and Socket.io server closed.');
    process.exit(0);
  });
});

module.exports = { app, httpServer, io };
