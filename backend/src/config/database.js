'use strict';

/**
 * database.js — SQLite connection, schema migrations, and DB accessor.
 *
 * Uses node:sqlite (built-in since Node 22, stable in Node 24).
 * No native compilation required — zero external DB dependency.
 * All SQL uses prepared statements — no string interpolation.
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const env = require('./env');
const logger = require('./logger');

// ─── Resolve DB path ──────────────────────────────────────────────────────────
// `:memory:` is SQLite's special in-memory database identifier and must not be
// resolved as a filesystem path. Keeping it intact makes the test suite fully
// isolated from the development database.
const dbPath = env.DB_PATH === ':memory:'
  ? ':memory:'
  : path.resolve(__dirname, '../../', env.DB_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  logger.info('Created database directory', { path: dbDir });
}

// ─── Open connection ──────────────────────────────────────────────────────────
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ─── Schema Migrations ────────────────────────────────────────────────────────
function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin',
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id                    TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      email                 TEXT NOT NULL UNIQUE,
      role                  TEXT NOT NULL DEFAULT 'operator',
      assigned_counter      TEXT NOT NULL DEFAULT 'Counter 01',
      assigned_service_ids  TEXT NOT NULL DEFAULT '[]',
      pin_hash              TEXT NOT NULL,
      is_online             INTEGER NOT NULL DEFAULT 0,
      avatar_url            TEXT,
      served_today_count    INTEGER NOT NULL DEFAULT 0,
      avg_handling_minutes  REAL NOT NULL DEFAULT 8.0,
      created_at            INTEGER NOT NULL,
      updated_at            INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      description         TEXT NOT NULL DEFAULT '',
      prefix              TEXT NOT NULL UNIQUE,
      avg_service_minutes INTEGER NOT NULL DEFAULT 8,
      icon                TEXT NOT NULL DEFAULT 'Info',
      color               TEXT NOT NULL DEFAULT 'emerald',
      is_active           INTEGER NOT NULL DEFAULT 1,
      max_daily_capacity  INTEGER,
      priority_weight     INTEGER NOT NULL DEFAULT 1,
      created_at          INTEGER NOT NULL,
      updated_at          INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id                     TEXT PRIMARY KEY,
      token_number           TEXT NOT NULL,
      service_id             TEXT NOT NULL REFERENCES services(id),
      service_name           TEXT NOT NULL,
      customer_name          TEXT NOT NULL,
      customer_phone         TEXT,
      customer_email         TEXT,
      notes                  TEXT,
      priority               TEXT NOT NULL DEFAULT 'normal',
      status                 TEXT NOT NULL DEFAULT 'waiting',
      joined_at              INTEGER NOT NULL,
      called_at              INTEGER,
      served_at              INTEGER,
      completed_at           INTEGER,
      counter_assigned       TEXT,
      staff_assigned_id      TEXT,
      staff_assigned_name    TEXT,
      estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
      created_at             INTEGER NOT NULL,
      updated_at             INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_status      ON tokens(status);
    CREATE INDEX IF NOT EXISTS idx_tokens_service_id  ON tokens(service_id);
    CREATE INDEX IF NOT EXISTS idx_tokens_joined_at   ON tokens(joined_at);

    CREATE TABLE IF NOT EXISTS settings (
      id                           INTEGER PRIMARY KEY DEFAULT 1,
      organization_name            TEXT NOT NULL DEFAULT 'Metropolitan Service Hub',
      venue_name                   TEXT NOT NULL DEFAULT 'Main Lobby & Customer Center',
      op_hours_start               TEXT NOT NULL DEFAULT '08:00',
      op_hours_end                 TEXT NOT NULL DEFAULT '18:30',
      days_open                    TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]',
      enable_sound_alerts          INTEGER NOT NULL DEFAULT 1,
      enable_speech_announcements  INTEGER NOT NULL DEFAULT 1,
      voice_type                   TEXT NOT NULL DEFAULT 'default',
      max_queue_size               INTEGER NOT NULL DEFAULT 200,
      auto_call_next_on_complete   INTEGER NOT NULL DEFAULT 0,
      sms_alerts_enabled           INTEGER NOT NULL DEFAULT 1,
      vip_priority_multiplier      REAL NOT NULL DEFAULT 2.0,
      theme                        TEXT NOT NULL DEFAULT 'dark-navy',
      updated_at                   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id           TEXT PRIMARY KEY,
      timestamp    INTEGER NOT NULL,
      action       TEXT NOT NULL,
      actor        TEXT NOT NULL,
      details      TEXT NOT NULL,
      token_number TEXT,
      type         TEXT NOT NULL DEFAULT 'info'
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  logger.info('Database migrations applied');
}

runMigrations();

module.exports = db;
