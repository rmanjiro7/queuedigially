# DATABASE.md — Database Schema

**Engine:** SQLite (better-sqlite3)
**File:** `backend/data/queuedigially.db`
**Strategy:** Single-file, single-tenant, no ORM.

---

## Tables

### admin_users
Stores admin portal credentials.
```sql
CREATE TABLE admin_users (
  id          TEXT PRIMARY KEY,          -- UUID
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- bcrypt
  role        TEXT NOT NULL DEFAULT 'admin',
  created_at  INTEGER NOT NULL,          -- Unix ms
  updated_at  INTEGER NOT NULL
);
```

### staff
Staff members (operators, supervisors, admins).
PIN stored as bcrypt hash.
```sql
CREATE TABLE staff (
  id                  TEXT PRIMARY KEY,  -- UUID
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  role                TEXT NOT NULL,     -- 'operator'|'supervisor'|'admin'
  assigned_counter    TEXT NOT NULL,
  assigned_service_ids TEXT NOT NULL,    -- JSON array: ["srv-1","srv-2"]
  pin_hash            TEXT NOT NULL,     -- bcrypt of 4-digit PIN
  is_online           INTEGER NOT NULL DEFAULT 0,  -- 0|1
  avatar_url          TEXT,
  served_today_count  INTEGER NOT NULL DEFAULT 0,
  avg_handling_minutes REAL NOT NULL DEFAULT 8.0,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);
```

### services
Service department configuration.
```sql
CREATE TABLE services (
  id                  TEXT PRIMARY KEY,  -- UUID
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  prefix              TEXT NOT NULL,     -- 'A', 'T', 'B', etc.
  avg_service_minutes INTEGER NOT NULL DEFAULT 8,
  icon                TEXT NOT NULL DEFAULT 'Info',
  color               TEXT NOT NULL DEFAULT 'emerald',
  is_active           INTEGER NOT NULL DEFAULT 1,
  max_daily_capacity  INTEGER,
  priority_weight     INTEGER DEFAULT 1,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);
```
**Constraints:** `prefix` must be unique per organization (UNIQUE on prefix).

### tokens
Queue tokens — the core entity.
```sql
CREATE TABLE tokens (
  id                  TEXT PRIMARY KEY,  -- UUID
  token_number        TEXT NOT NULL,     -- e.g. 'A-042'
  service_id          TEXT NOT NULL REFERENCES services(id),
  service_name        TEXT NOT NULL,     -- denormalized for display speed
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  customer_email      TEXT,
  notes               TEXT,
  priority            TEXT NOT NULL DEFAULT 'normal',  -- 'normal'|'priority'|'vip'
  status              TEXT NOT NULL DEFAULT 'waiting', -- see TokenStatus
  joined_at           INTEGER NOT NULL,   -- Unix ms
  called_at           INTEGER,
  served_at           INTEGER,
  completed_at        INTEGER,
  counter_assigned    TEXT,
  staff_assigned_id   TEXT REFERENCES staff(id),
  staff_assigned_name TEXT,              -- denormalized
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);
```
**Indexes:**
- `idx_tokens_status` ON `tokens(status)`
- `idx_tokens_service_id` ON `tokens(service_id)`
- `idx_tokens_joined_at` ON `tokens(joined_at)`
- `idx_tokens_token_number` ON `tokens(token_number)` UNIQUE per day (enforced in service layer)

**TokenStatus values:** `waiting`, `called`, `serving`, `completed`, `skipped`, `cancelled`

**Valid transitions:**
```
waiting → called → serving → completed
waiting → cancelled
called  → skipped
called  → serving → skipped (no-show after arrival)
skipped → called  (recall)
```

### settings
Single-row org configuration table.
```sql
CREATE TABLE settings (
  id                        INTEGER PRIMARY KEY DEFAULT 1,  -- always row 1
  organization_name         TEXT NOT NULL DEFAULT 'Metropolitan Service Hub',
  venue_name                TEXT NOT NULL DEFAULT 'Main Lobby & Customer Center',
  op_hours_start            TEXT NOT NULL DEFAULT '08:00',
  op_hours_end              TEXT NOT NULL DEFAULT '18:30',
  days_open                 TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]',
  enable_sound_alerts       INTEGER NOT NULL DEFAULT 1,
  enable_speech_announcements INTEGER NOT NULL DEFAULT 1,
  voice_type                TEXT NOT NULL DEFAULT 'default',
  max_queue_size            INTEGER NOT NULL DEFAULT 200,
  auto_call_next_on_complete INTEGER NOT NULL DEFAULT 0,
  sms_alerts_enabled        INTEGER NOT NULL DEFAULT 1,
  vip_priority_multiplier   REAL NOT NULL DEFAULT 2.0,
  theme                     TEXT NOT NULL DEFAULT 'dark-navy',
  updated_at                INTEGER NOT NULL
);
```
**Note:** Always upsert row 1. Never insert new rows.

### audit_logs
Append-only system event log.
```sql
CREATE TABLE audit_logs (
  id           TEXT PRIMARY KEY,   -- UUID
  timestamp    INTEGER NOT NULL,   -- Unix ms
  action       TEXT NOT NULL,
  actor        TEXT NOT NULL,
  details      TEXT NOT NULL,
  token_number TEXT,
  type         TEXT NOT NULL DEFAULT 'info'  -- 'info'|'success'|'warning'|'alert'
);
```
**Indexes:** `idx_audit_logs_timestamp` ON `audit_logs(timestamp DESC)`
**Note:** No UPDATE or DELETE. Purge policy: keep last 1000 rows (enforced on insert).

---

## Soft Delete
Not used in v1. Status-based lifecycle is sufficient for tokens. Hard delete only for services and staff.

## Daily Reset
Token sequence numbers reset at midnight (handled in token number generation utility).

## Migrations
Inline DDL in `backend/src/config/database.js` — run on startup if tables don't exist.
