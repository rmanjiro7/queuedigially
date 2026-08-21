'use strict';

/**
 * token.repository.js — All database access for queue tokens.
 * Uses node:sqlite (DatabaseSync) built into Node 22+.
 * Named parameters use $name syntax.
 */

const db = require('../config/database');

function rowToToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    tokenNumber: row.token_number,
    serviceId: row.service_id,
    serviceName: row.service_name,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || null,
    customerEmail: row.customer_email || null,
    notes: row.notes || null,
    priority: row.priority,
    status: row.status,
    joinedAt: row.joined_at,
    calledAt: row.called_at || null,
    servedAt: row.served_at || null,
    completedAt: row.completed_at || null,
    counterAssigned: row.counter_assigned || null,
    staffAssignedId: row.staff_assigned_id || null,
    staffAssignedName: row.staff_assigned_name || null,
    estimatedWaitMinutes: row.estimated_wait_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const tokenRepository = {
  insert(token) {
    db.prepare(`
      INSERT INTO tokens (
        id, token_number, service_id, service_name, customer_name,
        customer_phone, customer_email, notes, priority, status,
        joined_at, called_at, served_at, completed_at, counter_assigned,
        staff_assigned_id, staff_assigned_name, estimated_wait_minutes,
        created_at, updated_at
      ) VALUES (
        $id, $tokenNumber, $serviceId, $serviceName, $customerName,
        $customerPhone, $customerEmail, $notes, $priority, $status,
        $joinedAt, $calledAt, $servedAt, $completedAt, $counterAssigned,
        $staffAssignedId, $staffAssignedName, $estimatedWaitMinutes,
        $createdAt, $updatedAt
      )
    `).run({
      $id: token.id,
      $tokenNumber: token.tokenNumber,
      $serviceId: token.serviceId,
      $serviceName: token.serviceName,
      $customerName: token.customerName,
      $customerPhone: token.customerPhone ?? null,
      $customerEmail: token.customerEmail ?? null,
      $notes: token.notes ?? null,
      $priority: token.priority,
      $status: token.status,
      $joinedAt: token.joinedAt,
      $calledAt: token.calledAt ?? null,
      $servedAt: token.servedAt ?? null,
      $completedAt: token.completedAt ?? null,
      $counterAssigned: token.counterAssigned ?? null,
      $staffAssignedId: token.staffAssignedId ?? null,
      $staffAssignedName: token.staffAssignedName ?? null,
      $estimatedWaitMinutes: token.estimatedWaitMinutes,
      $createdAt: token.createdAt,
      $updatedAt: token.updatedAt,
    });
    return this.findById(token.id);
  },

  findById(id) {
    return rowToToken(db.prepare('SELECT * FROM tokens WHERE id = $id').get({ $id: id }));
  },

  findByTokenNumber(tokenNumber) {
    return rowToToken(
      db.prepare('SELECT * FROM tokens WHERE token_number = $n ORDER BY joined_at DESC LIMIT 1')
        .get({ $n: tokenNumber })
    );
  },

  findAll({ status, serviceId, date, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM tokens WHERE 1=1';
    const params = {};

    if (status)    { sql += ' AND status = $status';        params.$status    = status; }
    if (serviceId) { sql += ' AND service_id = $serviceId'; params.$serviceId = serviceId; }
    if (date) {
      const dayStart = new Date(date + 'T00:00:00').getTime();
      params.$dayStart = dayStart;
      params.$dayEnd   = dayStart + 86_400_000;
      sql += ' AND joined_at >= $dayStart AND joined_at < $dayEnd';
    }

    sql += ' ORDER BY joined_at ASC LIMIT $limit OFFSET $offset';
    params.$limit  = limit;
    params.$offset = offset;

    return db.prepare(sql).all(params).map(rowToToken);
  },

  count({ status, serviceId, date } = {}) {
    let sql = 'SELECT COUNT(*) AS cnt FROM tokens WHERE 1=1';
    const params = {};

    if (status)    { sql += ' AND status = $status';        params.$status    = status; }
    if (serviceId) { sql += ' AND service_id = $serviceId'; params.$serviceId = serviceId; }
    if (date) {
      const dayStart = new Date(date + 'T00:00:00').getTime();
      params.$dayStart = dayStart;
      params.$dayEnd   = dayStart + 86_400_000;
      sql += ' AND joined_at >= $dayStart AND joined_at < $dayEnd';
    }

    const row = db.prepare(sql).get(params);
    return row ? row.cnt : 0;
  },

  findWaitingByService(serviceId) {
    return db.prepare(`
      SELECT * FROM tokens
      WHERE status = 'waiting' AND service_id = $serviceId
      ORDER BY
        CASE priority WHEN 'vip' THEN 1 WHEN 'priority' THEN 2 ELSE 3 END ASC,
        joined_at ASC
    `).all({ $serviceId: serviceId }).map(rowToToken);
  },

  findAllWaiting(assignedServiceIds = null) {
    if (assignedServiceIds && assignedServiceIds.length > 0) {
      // node:sqlite doesn't support array binding directly — build placeholders
      const placeholders = assignedServiceIds.map((_, i) => `$sid${i}`).join(',');
      const params = {};
      assignedServiceIds.forEach((id, i) => { params[`$sid${i}`] = id; });
      return db.prepare(`
        SELECT * FROM tokens
        WHERE status = 'waiting' AND service_id IN (${placeholders})
        ORDER BY CASE priority WHEN 'vip' THEN 1 WHEN 'priority' THEN 2 ELSE 3 END ASC,
                 joined_at ASC
      `).all(params).map(rowToToken);
    }
    return db.prepare(`
      SELECT * FROM tokens
      WHERE status = 'waiting'
      ORDER BY CASE priority WHEN 'vip' THEN 1 WHEN 'priority' THEN 2 ELSE 3 END ASC,
               joined_at ASC
    `).all({}).map(rowToToken);
  },

  findActive() {
    return db.prepare(`
      SELECT * FROM tokens WHERE status IN ('called','serving') ORDER BY called_at ASC
    `).all({}).map(rowToToken);
  },

  update(id, fields) {
    const columnMap = {
      status:               'status',
      calledAt:             'called_at',
      servedAt:             'served_at',
      completedAt:          'completed_at',
      counterAssigned:      'counter_assigned',
      staffAssignedId:      'staff_assigned_id',
      staffAssignedName:    'staff_assigned_name',
      estimatedWaitMinutes: 'estimated_wait_minutes',
      notes:                'notes',
    };

    const setClauses = [];
    const params = { $id: id, $updatedAt: Date.now() };

    Object.entries(fields).forEach(([key, value]) => {
      const col = columnMap[key];
      if (col) {
        setClauses.push(`${col} = $${key}`);
        params[`$${key}`] = value ?? null;
      }
    });

    if (setClauses.length === 0) return this.findById(id);

    db.prepare(`UPDATE tokens SET ${setClauses.join(', ')}, updated_at = $updatedAt WHERE id = $id`).run(params);
    return this.findById(id);
  },

  countActiveToday() {
    const row = db.prepare(`
      SELECT COUNT(*) AS cnt FROM tokens
      WHERE status IN ('waiting','called','serving') AND joined_at >= $todayStart
    `).get({ $todayStart: getTodayStart() });
    return row ? row.cnt : 0;
  },

  countForServiceToday(serviceId) {
    const row = db.prepare(`
      SELECT COUNT(*) AS cnt FROM tokens WHERE service_id = $sid AND joined_at >= $todayStart
    `).get({ $sid: serviceId, $todayStart: getTodayStart() });
    return row ? row.cnt : 0;
  },

  getStatsByStatus() {
    const rows = db.prepare(`
      SELECT status, COUNT(*) AS cnt FROM tokens WHERE joined_at >= $todayStart GROUP BY status
    `).all({ $todayStart: getTodayStart() });
    const stats = { waiting: 0, called: 0, serving: 0, completed: 0, skipped: 0, cancelled: 0 };
    rows.forEach((r) => { if (r.status in stats) stats[r.status] = r.cnt; });
    return stats;
  },

  getStatsByService() {
    return db.prepare(`
      SELECT service_id, service_name, COUNT(*) AS total,
             SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting
      FROM tokens WHERE joined_at >= $todayStart GROUP BY service_id
    `).all({ $todayStart: getTodayStart() });
  },

  getAvgWaitMs() {
    const row = db.prepare(`
      SELECT AVG(served_at - joined_at) AS avg_wait_ms FROM tokens
      WHERE status = 'completed' AND served_at IS NOT NULL AND joined_at >= $todayStart
    `).get({ $todayStart: getTodayStart() });
    return row && row.avg_wait_ms ? row.avg_wait_ms : 0;
  },
};

function getTodayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}

module.exports = tokenRepository;
