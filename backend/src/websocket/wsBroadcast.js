'use strict';

/**
 * wsBroadcast.js — WebSocket server + broadcast utilities.
 *
 * Attaches to an existing http.Server via the 'upgrade' event.
 * Broadcasts JSON events to all connected clients.
 *
 * Client connection: ws://host:PORT (no path required)
 * Clients may send { type: 'PING' } to keep alive.
 */

const { WebSocketServer } = require('ws');
const logger = require('../config/logger');

let wss = null;

/**
 * Attach WebSocket server to an existing http.Server instance.
 * @param {import('http').Server} httpServer
 */
function attachWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress || 'unknown';
    logger.info('WebSocket client connected', { ip, clients: wss.clients.size });

    // Send current connection count acknowledgement
    ws.send(JSON.stringify({ event: 'CONNECTED', data: { message: 'QueueFlow WS connected' }, timestamp: Date.now() }));

    ws.on('message', (rawMsg) => {
      try {
        const msg = JSON.parse(rawMsg.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ event: 'PONG', timestamp: Date.now() }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      logger.debug('WebSocket client disconnected', { ip, remaining: wss.clients.size });
    });

    ws.on('error', (err) => {
      logger.warn('WebSocket client error', { ip, error: err.message });
    });
  });

  wss.on('error', (err) => {
    logger.error('WebSocket server error', { error: err.message });
  });

  logger.info('WebSocket server attached to HTTP server');
}

/**
 * Broadcast an event payload to all connected WebSocket clients.
 * @param {string} event - Event name (from WS_EVENTS constants)
 * @param {object} data - Payload to broadcast
 */
function broadcast(event, data) {
  if (!wss) return;

  const message = JSON.stringify({ event, data, timestamp: Date.now() });

  let sent = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sent++;
    }
  });

  logger.debug('WS broadcast', { event, clients: sent });
}

/**
 * Get the number of currently connected clients.
 */
function getClientCount() {
  return wss ? wss.clients.size : 0;
}

module.exports = { attachWebSocket, broadcast, getClientCount };
