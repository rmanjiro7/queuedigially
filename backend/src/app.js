'use strict';

/**
 * app.js — Express application setup.
 *
 * Configures middleware stack and mounts all routes.
 * Does NOT start the server (that's server.js).
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { errorHandler } = require('./middlewares/errorHandler');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const tokensRoutes     = require('./routes/tokens.routes');
const servicesRoutes   = require('./routes/services.routes');
const staffRoutes      = require('./routes/staff.routes');
const settingsRoutes   = require('./routes/settings.routes');
const auditLogsRoutes  = require('./routes/auditLogs.routes');
const statsRoutes      = require('./routes/stats.routes');
const displayRoutes    = require('./routes/display.routes');
const adminRoutes      = require('./routes/admin.routes');

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow WebSocket connections from same origin
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    logger.warn('CORS blocked request', { origin });
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── HTTP logging ─────────────────────────────────────────────────────────────
app.use(morgan(env.isProduction ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/api/v1/health', // Don't log health checks
}));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Health check (no auth, no rate limit) ───────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/tokens',      tokensRoutes);
app.use('/api/v1/services',    servicesRoutes);
app.use('/api/v1/staff',       staffRoutes);
app.use('/api/v1/settings',    settingsRoutes);
app.use('/api/v1/audit-logs',  auditLogsRoutes);
app.use('/api/v1/stats',       statsRoutes);
app.use('/api/v1/display',     displayRoutes);
app.use('/api/v1/admin',       adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
});

// ─── Central error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
