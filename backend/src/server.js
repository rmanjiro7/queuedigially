'use strict';

/**
 * server.js — HTTP + WebSocket server entry point.
 *
 * 1. Loads and validates environment variables
 * 2. Connects to the database and runs migrations
 * 3. Seeds initial data if DB is empty
 * 4. Creates the HTTP server from the Express app
 * 5. Attaches the WebSocket server to the same port
 * 6. Starts listening
 */

// ─── Load .env before anything else ──────────────────────────────────────────
// Inline dotenv loader — no dependency needed.
// Must run synchronously BEFORE env.js is required.
(function loadDotEnv() {
  const fs = require('fs');
  const path = require('path');
  const envFile = path.resolve(__dirname, '..', '.env');
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = val;
      }
    });
  } catch {
    // .env not found — environment variables must be set externally (production)
  }
}());

const http = require('http');

// ─── Validate environment first ───────────────────────────────────────────────
const env = require('./config/env');
const logger = require('./config/logger');

// ─── Connect DB (runs migrations on import) ───────────────────────────────────
require('./config/database');

// ─── Seed initial data ────────────────────────────────────────────────────────
const { seed } = require('./utils/seed');

// ─── Express app ─────────────────────────────────────────────────────────────
const app = require('./app');

// ─── HTTP server ─────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket server (same port) ────────────────────────────────────────────
const { attachWebSocket } = require('./websocket/wsBroadcast');
attachWebSocket(server);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Seed runs only if tables are empty (idempotent)
    await seed();

    server.listen(env.PORT, () => {
      logger.info(`QueueDigially API server started`, {
        port: env.PORT,
        env: env.NODE_ENV,
        db: env.DB_PATH,
      });
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`WebSocket:    ws://localhost:${env.PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    // better-sqlite3 closes automatically when the process exits
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  process.exit(1);
});

start();
