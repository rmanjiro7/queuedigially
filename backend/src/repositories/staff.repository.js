'use strict';

const db = require('../config/database');

function rowToStaff(row, includePinHash = false) {
  if (!row) return null;
  const staff = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    assignedCounter: row.assigned_counter,
    assignedServiceIds: JSON.parse(row.assigned_service_ids || '[]'),
    isOnline: row.is_online === 1,
    avatarUrl: row.avatar_url || null,
    servedTodayCount: row.served_today_count,
    avgHandlingMinutes: row.avg_handling_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includePinHash) staff._pinHash = row.pin_hash;
  return staff;
}

const staffRepository = {
  findAll() {
    return db.prepare('SELECT * FROM staff ORDER BY name ASC').all({}).map((r) => rowToStaff(r));
  },

  findById(id, withPin = false) {
    return rowToStaff(db.prepare('SELECT * FROM staff WHERE id = $id').get({ $id: id }), withPin);
  },

  findByEmail(email, withPin = false) {
    return rowToStaff(
      db.prepare('SELECT * FROM staff WHERE email = $email').get({ $email: email.toLowerCase() }),
      withPin
    );
  },

  findByIdForAuth(id) {
    const row = db.prepare('SELECT * FROM staff WHERE id = $id').get({ $id: id });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      assignedCounter: row.assigned_counter,
      assignedServiceIds: JSON.parse(row.assigned_service_ids || '[]'),
      pinHash: row.pin_hash,
    };
  },

  insert(staff) {
    db.prepare(`
      INSERT INTO staff (id, name, email, role, assigned_counter, assigned_service_ids, pin_hash, is_online, avatar_url, served_today_count, avg_handling_minutes, created_at, updated_at)
      VALUES ($id, $name, $email, $role, $assignedCounter, $assignedServiceIds, $pinHash, $isOnline, $avatarUrl, $servedTodayCount, $avgHandlingMinutes, $createdAt, $updatedAt)
    `).run({
      $id: staff.id,
      $name: staff.name,
      $email: staff.email,
      $role: staff.role,
      $assignedCounter: staff.assignedCounter,
      $assignedServiceIds: JSON.stringify(staff.assignedServiceIds || []),
      $pinHash: staff.pinHash,
      $isOnline: staff.isOnline ? 1 : 0,
      $avatarUrl: staff.avatarUrl ?? null,
      $servedTodayCount: staff.servedTodayCount,
      $avgHandlingMinutes: staff.avgHandlingMinutes,
      $createdAt: staff.createdAt,
      $updatedAt: staff.updatedAt,
    });
    return this.findById(staff.id);
  },

  update(id, fields) {
    const columnMap = {
      name: 'name', email: 'email', role: 'role',
      assignedCounter: 'assigned_counter', assignedServiceIds: 'assigned_service_ids',
      pinHash: 'pin_hash', isOnline: 'is_online', avatarUrl: 'avatar_url',
      servedTodayCount: 'served_today_count', avgHandlingMinutes: 'avg_handling_minutes',
    };

    const setClauses = [];
    const params = { $id: id, $updatedAt: Date.now() };

    Object.entries(fields).forEach(([key, value]) => {
      const col = columnMap[key];
      if (col) {
        setClauses.push(`${col} = $${key}`);
        if (key === 'assignedServiceIds') params[`$${key}`] = JSON.stringify(value);
        else if (key === 'isOnline') params[`$${key}`] = value ? 1 : 0;
        else params[`$${key}`] = value ?? null;
      }
    });

    if (setClauses.length === 0) return this.findById(id);
    db.prepare(`UPDATE staff SET ${setClauses.join(', ')}, updated_at = $updatedAt WHERE id = $id`).run(params);
    return this.findById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM staff WHERE id = $id').run({ $id: id });
  },

  incrementServedCount(id) {
    db.prepare('UPDATE staff SET served_today_count = served_today_count + 1, updated_at = $now WHERE id = $id')
      .run({ $now: Date.now(), $id: id });
  },
};

module.exports = staffRepository;
