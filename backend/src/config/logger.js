'use strict';

/**
 * logger.js — Structured console logger.
 * Prefixes every log with ISO timestamp and level.
 * Never logs passwords, tokens, or secrets.
 */

const env = require('./env');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const configuredLevel = LEVELS[env.LOG_LEVEL] ?? LEVELS.info;

const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
};

const logger = {
  debug: (msg, meta = {}) => {
    if (LEVELS.debug >= configuredLevel) {
      console.debug(format('debug', msg, meta));
    }
  },
  info: (msg, meta = {}) => {
    if (LEVELS.info >= configuredLevel) {
      console.info(format('info', msg, meta));
    }
  },
  warn: (msg, meta = {}) => {
    if (LEVELS.warn >= configuredLevel) {
      console.warn(format('warn', msg, meta));
    }
  },
  error: (msg, meta = {}) => {
    if (LEVELS.error >= configuredLevel) {
      console.error(format('error', msg, meta));
    }
  },
};

module.exports = logger;
