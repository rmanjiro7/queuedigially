'use strict';

/**
 * seed.js — Seeds the database with initial demo data on first run.
 * Idempotent: runs only if admin_users table is empty.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../config/logger');

async function seed() {
  const adminCount = db.prepare('SELECT COUNT(*) AS cnt FROM admin_users').get({}).cnt;
  if (adminCount > 0) {
    logger.info('Database already seeded — skipping');
    return;
  }

  logger.info('Seeding database with initial demo data...');
  const now = Date.now();
  const min = 60 * 1000;

  // ─── Admin User ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at)
    VALUES ($id, $email, $hash, 'admin', $now, $now)
  `).run({ $id: uuidv4(), $email: 'admin@queueflow.com', $hash: passwordHash, $now: now });

  // ─── Services ─────────────────────────────────────────────────────────────
  const services = [
    { id: 'srv-1', name: 'General Inquiries',      description: 'Account assistance, general queries, form collection & desk guidance',          prefix: 'A', avg: 8,  icon: 'Info',       color: 'emerald', cap: 120, weight: 1 },
    { id: 'srv-2', name: 'Technical Support',       description: 'Hardware diagnostics, configuration help & software troubleshooting',          prefix: 'T', avg: 18, icon: 'Wrench',      color: 'blue',    cap: 60,  weight: 2 },
    { id: 'srv-3', name: 'Billing & Payments',      description: 'Invoicing, payment processing, fee settlements & refunds',                    prefix: 'B', avg: 6,  icon: 'CreditCard',  color: 'purple',  cap: 100, weight: 1 },
    { id: 'srv-4', name: 'Order Pickup & Returns',  description: 'Express collection of reserved packages and quick product returns',           prefix: 'P', avg: 4,  icon: 'Package',     color: 'amber',   cap: 150, weight: 1 },
    { id: 'srv-5', name: 'VIP Concierge',           description: 'Dedicated priority support for premium tier accounts and executive clients',  prefix: 'V', avg: 12, icon: 'Sparkles',    color: 'indigo',  cap: 40,  weight: 3 },
  ];
  const srvStmt = db.prepare(`
    INSERT INTO services (id, name, description, prefix, avg_service_minutes, icon, color, is_active, max_daily_capacity, priority_weight, created_at, updated_at)
    VALUES ($id, $name, $description, $prefix, $avg, $icon, $color, 1, $cap, $weight, $now, $now)
  `);
  for (const s of services) srvStmt.run({ $id: s.id, $name: s.name, $description: s.description, $prefix: s.prefix, $avg: s.avg, $icon: s.icon, $color: s.color, $cap: s.cap, $weight: s.weight, $now: now });

  // ─── Staff ────────────────────────────────────────────────────────────────
  const defaultPin = await bcrypt.hash('1234', 10);
  const staffMembers = [
    { id: 'staff-1', name: 'Sarah Jenkins',   email: 'sarah.jenkins@queueflow.internal',  role: 'supervisor', counter: 'Counter 03', sids: '["srv-1","srv-2","srv-3","srv-4","srv-5"]', online: 1, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', served: 24, avg: 7.2  },
    { id: 'staff-2', name: 'Marcus Chen',     email: 'marcus.chen@queueflow.internal',    role: 'operator',   counter: 'Counter 01', sids: '["srv-1","srv-4"]',                         online: 1, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', served: 19, avg: 6.4  },
    { id: 'staff-3', name: 'Elena Rodriguez', email: 'elena.rodriguez@queueflow.internal', role: 'operator',   counter: 'Counter 02', sids: '["srv-2","srv-5"]',                         online: 1, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', served: 16, avg: 14.1 },
    { id: 'staff-4', name: 'David Kim',       email: 'david.kim@queueflow.internal',      role: 'operator',   counter: 'Counter 04', sids: '["srv-3"]',                                 online: 0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', served: 12, avg: 5.8  },
  ];
  const staffStmt = db.prepare(`
    INSERT INTO staff (id, name, email, role, assigned_counter, assigned_service_ids, pin_hash, is_online, avatar_url, served_today_count, avg_handling_minutes, created_at, updated_at)
    VALUES ($id, $name, $email, $role, $counter, $sids, $pin, $online, $avatar, $served, $avg, $now, $now)
  `);
  for (const s of staffMembers) staffStmt.run({ $id: s.id, $name: s.name, $email: s.email, $role: s.role, $counter: s.counter, $sids: s.sids, $pin: defaultPin, $online: s.online, $avatar: s.avatar, $served: s.served, $avg: s.avg, $now: now });

  // ─── Settings ─────────────────────────────────────────────────────────────
  db.prepare(`
    INSERT INTO settings (id, organization_name, venue_name, op_hours_start, op_hours_end, days_open, enable_sound_alerts, enable_speech_announcements, voice_type, max_queue_size, auto_call_next_on_complete, sms_alerts_enabled, vip_priority_multiplier, theme, updated_at)
    VALUES (1, 'Metropolitan Service Hub', 'Main Lobby & Customer Center', '08:00', '18:30', '["Mon","Tue","Wed","Thu","Fri","Sat"]', 1, 1, 'default', 200, 0, 1, 2.0, 'dark-navy', $now)
  `).run({ $now: now });

  // ─── Demo Tokens ──────────────────────────────────────────────────────────
  const tokStmt = db.prepare(`
    INSERT INTO tokens (id, token_number, service_id, service_name, customer_name, customer_phone, customer_email, notes, priority, status, joined_at, called_at, served_at, completed_at, counter_assigned, staff_assigned_id, staff_assigned_name, estimated_wait_minutes, created_at, updated_at)
    VALUES ($id, $num, $srvId, $srvName, $cust, $phone, $email, $notes, $priority, $status, $joinedAt, $calledAt, $servedAt, $completedAt, $counter, $staffId, $staffName, $estWait, $joinedAt, $joinedAt)
  `);
  const tokens = [
    { id:'tok-39', num:'A-039', srvId:'srv-1', srvName:'General Inquiries',    cust:'Robert Vance',  phone:'+1 (555) 234-8901', email:null, notes:'Inquiring about business permit renewal timeline.', priority:'normal', status:'serving',   joinedAt:now-35*min, calledAt:now-6*min,  servedAt:now-5*min,  completedAt:null,       counter:'Counter 03', staffId:'staff-1', staffName:'Sarah Jenkins', estWait:0  },
    { id:'tok-40', num:'B-014', srvId:'srv-3', srvName:'Billing & Payments',   cust:'Maya Patel',    phone:'+1 (555) 345-6712', email:null, notes:null,                                                priority:'normal', status:'serving',   joinedAt:now-28*min, calledAt:now-3*min,  servedAt:now-2*min,  completedAt:null,       counter:'Counter 01', staffId:'staff-2', staffName:'Marcus Chen',   estWait:0  },
    { id:'tok-41', num:'A-040', srvId:'srv-1', srvName:'General Inquiries',    cust:'Liam Johnson',  phone:'+1 (555) 456-7890', email:null, notes:'Address verification update.',                    priority:'normal', status:'waiting',   joinedAt:now-18*min, calledAt:null,       servedAt:null,       completedAt:null,       counter:null,         staffId:null,      staffName:null,            estWait:4  },
    { id:'tok-42', num:'A-041', srvId:'srv-1', srvName:'General Inquiries',    cust:'Sophia Miller', phone:'+1 (555) 567-8901', email:null, notes:'Executive client - expedite requested.',         priority:'vip',    status:'waiting',   joinedAt:now-15*min, calledAt:null,       servedAt:null,       completedAt:null,       counter:null,         staffId:null,      staffName:null,            estWait:7  },
    { id:'tok-43', num:'A-042', srvId:'srv-1', srvName:'General Inquiries',    cust:'Alex Rivera',   phone:'+1 (555) 789-0123', email:'alex.rivera@example.com', notes:'New account setup verification.', priority:'normal', status:'waiting', joinedAt:now-12*min, calledAt:null, servedAt:null, completedAt:null, counter:null, staffId:null, staffName:null, estWait:11 },
    { id:'tok-44', num:'T-008', srvId:'srv-2', srvName:'Technical Support',    cust:'Daniel Harris', phone:'+1 (555) 890-1234', email:null, notes:'Hardware terminal diagnostic error code 403.', priority:'normal', status:'waiting',   joinedAt:now-10*min, calledAt:null,       servedAt:null,       completedAt:null,       counter:null,         staffId:null,      staffName:null,            estWait:16 },
    { id:'tok-45', num:'P-022', srvId:'srv-4', srvName:'Order Pickup & Returns',cust:'Chloe Bennett', phone:'+1 (555) 901-2345', email:null, notes:'Express order ID #88921.',                    priority:'normal', status:'waiting',   joinedAt:now-7*min,  calledAt:null,       servedAt:null,       completedAt:null,       counter:null,         staffId:null,      staffName:null,            estWait:18 },
    { id:'tok-37', num:'A-037', srvId:'srv-1', srvName:'General Inquiries',    cust:'Emma Watson',   phone:null,                email:null, notes:null,                                            priority:'normal', status:'completed', joinedAt:now-50*min, calledAt:now-22*min, servedAt:now-21*min, completedAt:now-14*min, counter:'Counter 03', staffId:'staff-1', staffName:'Sarah Jenkins', estWait:0  },
    { id:'tok-38', num:'A-038', srvId:'srv-1', srvName:'General Inquiries',    cust:'Lucas Grey',    phone:null,                email:null, notes:null,                                            priority:'normal', status:'completed', joinedAt:now-45*min, calledAt:now-15*min, servedAt:now-14*min, completedAt:now-6*min,  counter:'Counter 03', staffId:'staff-1', staffName:'Sarah Jenkins', estWait:0  },
  ];
  for (const t of tokens) {
    tokStmt.run({
      $id: t.id, $num: t.num, $srvId: t.srvId, $srvName: t.srvName, $cust: t.cust,
      $phone: t.phone, $email: t.email, $notes: t.notes, $priority: t.priority, $status: t.status,
      $joinedAt: t.joinedAt, $calledAt: t.calledAt, $servedAt: t.servedAt, $completedAt: t.completedAt,
      $counter: t.counter, $staffId: t.staffId, $staffName: t.staffName, $estWait: t.estWait,
    });
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  const logStmt = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, action, actor, details, token_number, type)
    VALUES ($id, $ts, $action, $actor, $details, $token, $type)
  `);
  const logs = [
    { ts: now-6*min,  action: 'Called Customer',      actor: 'Sarah Jenkins (Counter 03)',  details: 'Called Token A-039 (Robert Vance) for General Inquiries', token: 'A-039', type: 'info'    },
    { ts: now-12*min, action: 'New Token Generated',  actor: 'Customer Self-Service (Web)', details: 'Generated Token A-042 for Alex Rivera (General Inquiries)', token: 'A-042', type: 'success' },
    { ts: now-14*min, action: 'Service Completed',    actor: 'Sarah Jenkins (Counter 03)',  details: 'Completed ticket A-037 in 7.0 minutes',                   token: 'A-037', type: 'success' },
    { ts: now-25*min, action: 'Queue Capacity Rule',  actor: 'System Auto-Monitor',         details: 'Peak capacity threshold 80% reached on General Inquiries', token: null,    type: 'warning' },
    { ts: now-45*min, action: 'Staff Terminal Login', actor: 'Sarah Jenkins (Counter 03)',  details: 'Signed in to Staff Terminal',                              token: null,    type: 'info'    },
    { ts: now-60*min, action: 'Admin Login',          actor: 'admin@queueflow.com',         details: 'Administrator authenticated to Admin Portal',              token: null,    type: 'success' },
  ];
  for (const l of logs) logStmt.run({ $id: uuidv4(), $ts: l.ts, $action: l.action, $actor: l.actor, $details: l.details, $token: l.token, $type: l.type });

  logger.info('Database seeded with initial demo data');
}

module.exports = { seed };
