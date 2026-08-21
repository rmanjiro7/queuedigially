'use strict';

const db = require('../config/database');
const { AUDIT_LOG_MAX_ROWS, AUDIT_LOG_PURGE_COUNT } = require('../constants');

function rowToLog(row) {
  if (!row) return null;
  return {
    id: row.id,
    timestamp: row.timestamp,
    action: row.action,
    actor: row.actor,
    details: row.details,
    tokenNumber: row.token_number || null,
    type: row.type,
  };
}

const auditLogRepository = {
  insert(log) {
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, actor, details, token_number, type)
      VALUES ($id, $timestamp, $action, $actor, $details, $tokenNumber, $type)
    `).run({
      $id: log.id,
      $timestamp: log.timestamp,
      $action: log.action,
      $actor: log.actor,
      $details: log.details,
      $tokenNumber: log.tokenNumber ?? null,
      $type: log.type,
    });

    // Enforce row cap
    const count = db.prepare('SELECT COUNT(*) AS cnt FROM audit_logs').get({}).cnt;
    if (count > AUDIT_LOG_MAX_ROWS) {
      db.prepare(`
        DELETE FROM audit_logs WHERE id IN (
          SELECT id FROM audit_logs ORDER BY timestamp ASC LIMIT $purge
        )
      `).run({ $purge: AUDIT_LOG_PURGE_COUNT });
    }
  },

  findAll({ limit = 50, offset = 0, type } = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = { $limit: limit, $offset: offset };
    if (type) { sql += ' AND type = $type'; params.$type = type; }
    sql += ' ORDER BY timestamp DESC LIMIT $limit OFFSET $offset';
    return db.prepare(sql).all(params).map(rowToLog);
  },

  count({ type } = {}) {
    let sql = 'SELECT COUNT(*) AS cnt FROM audit_logs WHERE 1=1';
    const params = {};
    if (type) { sql += ' AND type = $type'; params.$type = type; }
    return db.prepare(sql).get(params).cnt;
  },
};

module.exports = auditLogRepository;
