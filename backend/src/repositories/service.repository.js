'use strict';

const db = require('../config/database');

function rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prefix: row.prefix,
    avgServiceMinutes: row.avg_service_minutes,
    icon: row.icon,
    color: row.color,
    isActive: row.is_active === 1,
    maxDailyCapacity: row.max_daily_capacity ?? null,
    priorityWeight: row.priority_weight,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const serviceRepository = {
  findAll() {
    return db.prepare('SELECT * FROM services ORDER BY name ASC').all({}).map(rowToService);
  },

  findById(id) {
    return rowToService(db.prepare('SELECT * FROM services WHERE id = $id').get({ $id: id }));
  },

  findByPrefix(prefix) {
    return rowToService(db.prepare('SELECT * FROM services WHERE prefix = $p').get({ $p: prefix.toUpperCase() }));
  },

  findActive() {
    return db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC').all({}).map(rowToService);
  },

  insert(service) {
    db.prepare(`
      INSERT INTO services (id, name, description, prefix, avg_service_minutes, icon, color, is_active, max_daily_capacity, priority_weight, created_at, updated_at)
      VALUES ($id, $name, $description, $prefix, $avgServiceMinutes, $icon, $color, $isActive, $maxDailyCapacity, $priorityWeight, $createdAt, $updatedAt)
    `).run({
      $id: service.id,
      $name: service.name,
      $description: service.description,
      $prefix: service.prefix,
      $avgServiceMinutes: service.avgServiceMinutes,
      $icon: service.icon,
      $color: service.color,
      $isActive: service.isActive ? 1 : 0,
      $maxDailyCapacity: service.maxDailyCapacity ?? null,
      $priorityWeight: service.priorityWeight,
      $createdAt: service.createdAt,
      $updatedAt: service.updatedAt,
    });
    return this.findById(service.id);
  },

  update(id, fields) {
    const columnMap = {
      name: 'name', description: 'description', prefix: 'prefix',
      avgServiceMinutes: 'avg_service_minutes', icon: 'icon', color: 'color',
      isActive: 'is_active', maxDailyCapacity: 'max_daily_capacity', priorityWeight: 'priority_weight',
    };

    const setClauses = [];
    const params = { $id: id, $updatedAt: Date.now() };

    Object.entries(fields).forEach(([key, value]) => {
      const col = columnMap[key];
      if (col) {
        setClauses.push(`${col} = $${key}`);
        params[`$${key}`] = key === 'isActive' ? (value ? 1 : 0) : (value ?? null);
      }
    });

    if (setClauses.length === 0) return this.findById(id);
    db.prepare(`UPDATE services SET ${setClauses.join(', ')}, updated_at = $updatedAt WHERE id = $id`).run(params);
    return this.findById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM services WHERE id = $id').run({ $id: id });
  },

  hasActiveTokens(serviceId) {
    const row = db.prepare(`
      SELECT COUNT(*) AS cnt FROM tokens
      WHERE service_id = $sid AND status IN ('waiting','called','serving')
    `).get({ $sid: serviceId });
    return row && row.cnt > 0;
  },
};

module.exports = serviceRepository;
