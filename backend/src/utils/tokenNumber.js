'use strict';

/**
 * tokenNumber.js — Generates sequential queue token numbers.
 * Format: {PREFIX}-{NNN}  e.g. A-001, T-042
 * Sequence resets at midnight each calendar day.
 */

const db = require('../config/database');

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function generateTokenNumber(prefix) {
  const todayStart = startOfTodayMs();
  const todayEnd   = todayStart + 86_400_000;

  const row = db.prepare(`
    SELECT COUNT(*) AS cnt FROM tokens
    WHERE token_number LIKE $pattern AND joined_at >= $start AND joined_at < $end
  `).get({ $pattern: `${prefix}-%`, $start: todayStart, $end: todayEnd });

  const nextSeq = (row ? row.cnt : 0) + 1;
  return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
}

module.exports = { generateTokenNumber };
