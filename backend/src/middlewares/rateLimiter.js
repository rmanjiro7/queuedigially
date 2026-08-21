'use strict';

/**
 * rateLimiter.js — Pre-configured rate limiters for different endpoint types.
 *
 * Uses express-rate-limit with in-memory store (sufficient for single-instance).
 * Upgrade to Redis store for multi-instance deployments.
 */

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const windowMs = env.RATE_LIMIT_WINDOW_MS; // default: 60_000 (1 minute)

/**
 * Global limiter — applied to all routes.
 * 100 requests per minute per IP.
 */
const globalLimiter = rateLimit({
  windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down', code: 'RATE_LIMITED' },
  skip: () => env.NODE_ENV === 'test' || env.NODE_ENV === 'development',
});

/**
 * Auth limiter — applied to login endpoints.
 * 5 attempts per minute per IP (brute-force protection).
 */
const authLimiter = rateLimit({
  windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later', code: 'RATE_LIMITED' },
  skip: () => env.NODE_ENV === 'test',
});

/**
 * Token creation limiter — applied to POST /api/v1/tokens.
 * 10 per minute per IP (prevent queue flooding).
 */
const tokenCreateLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many ticket requests, please wait a moment', code: 'RATE_LIMITED' },
  skip: () => env.NODE_ENV === 'test',
});

/**
 * Display board limiter — applied to GET /api/v1/display.
 * 30 per minute per IP (frequent polling from TV screens).
 */
const displayLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many display requests', code: 'RATE_LIMITED' },
  skip: () => env.NODE_ENV === 'test',
});

module.exports = { globalLimiter, authLimiter, tokenCreateLimiter, displayLimiter };
