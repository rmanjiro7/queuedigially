'use strict';

/**
 * Test database seeder.
 * Creates an isolated in-memory SQLite DB for each test suite.
 * Sets process.env vars before any module is loaded.
 */

const path = require('path');

// ─── Point to in-memory DB and set required env vars ─────────────────────────
// Must be called BEFORE requiring any app module.
function setupTestEnv() {
  process.env.NODE_ENV   = 'test';
  process.env.JWT_SECRET = 'test-secret-32-characters-xxxxxxxx';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.DB_PATH    = ':memory:';
  process.env.PORT       = '0';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.LOG_LEVEL  = 'error'; // suppress logs during tests
}

/**
 * Seed minimal test data.
 * Call after setupTestEnv() and after requiring the db module.
 */
async function seedTestData(db) {
  const bcrypt = require('bcryptjs');
  const now = Date.now();

  // Admin
  const hash = await bcrypt.hash('admin123', 1); // rounds=1 for speed in tests
  db.prepare(`INSERT INTO admin_users (id,email,password_hash,role,created_at,updated_at) VALUES ($id,$email,$hash,'admin',$now,$now)`)
    .run({ $id:'admin-1', $email:'admin@test.com', $hash: hash, $now: now });

  // Service
  db.prepare(`INSERT INTO services (id,name,description,prefix,avg_service_minutes,icon,color,is_active,max_daily_capacity,priority_weight,created_at,updated_at) VALUES ($id,$name,'',  $prefix,8,'Info','emerald',1,100,1,$now,$now)`)
    .run({ $id:'srv-1', $name:'General', $prefix:'A', $now: now });
  db.prepare(`INSERT INTO services (id,name,description,prefix,avg_service_minutes,icon,color,is_active,max_daily_capacity,priority_weight,created_at,updated_at) VALUES ($id,$name,'',  $prefix,8,'Info','blue',0,null,1,$now,$now)`)
    .run({ $id:'srv-inactive', $name:'Inactive Svc', $prefix:'Z', $now: now });

  // Staff
  const pin = await bcrypt.hash('1234', 1);
  db.prepare(`INSERT INTO staff (id,name,email,role,assigned_counter,assigned_service_ids,pin_hash,is_online,avatar_url,served_today_count,avg_handling_minutes,created_at,updated_at) VALUES ($id,$name,$email,$role,$counter,$sids,$pin,1,null,0,8,$now,$now)`)
    .run({ $id:'staff-1', $name:'Test Operator', $email:'op@test.com', $role:'operator', $counter:'Counter 01', $sids:'["srv-1"]', $pin: pin, $now: now });

  // Settings
  db.prepare(`INSERT INTO settings (id,organization_name,venue_name,op_hours_start,op_hours_end,days_open,enable_sound_alerts,enable_speech_announcements,voice_type,max_queue_size,auto_call_next_on_complete,sms_alerts_enabled,vip_priority_multiplier,theme,updated_at) VALUES (1,'Test Org','Test Venue','08:00','18:00','["Mon"]',1,1,'default',200,0,1,2.0,'dark-navy',$now)`)
    .run({ $now: now });
}

module.exports = { setupTestEnv, seedTestData };
