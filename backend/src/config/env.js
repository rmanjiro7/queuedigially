'use strict';

/**
 * env.js — Validated environment configuration.
 * Throws on startup if required variables are missing or invalid.
 * Import this module everywhere instead of process.env directly.
 */

const required = (name) => {
  const val = process.env[name];
  if (!val || val.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val.trim();
};

const optional = (name, defaultValue = '') => {
  const val = process.env[name];
  return val && val.trim() !== '' ? val.trim() : defaultValue;
};

const optionalInt = (name, defaultValue) => {
  const val = process.env[name];
  if (!val || val.trim() === '') return defaultValue;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) throw new Error(`Environment variable ${name} must be an integer`);
  return parsed;
};

module.exports = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: optionalInt('PORT', 3001),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '8h'),
  DB_PATH: optional('DB_PATH', './data/queuedigially.db'),
  ALLOWED_ORIGINS: optional('ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  RATE_LIMIT_WINDOW_MS: optionalInt('RATE_LIMIT_WINDOW_MS', 60_000),
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),
  isProduction: optional('NODE_ENV', 'development') === 'production',
  isDevelopment: optional('NODE_ENV', 'development') === 'development',
};
