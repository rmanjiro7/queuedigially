'use strict';

/**
 * constants/index.js — Application-wide enumerations and constants.
 */

const TOKEN_STATUS = Object.freeze({
  WAITING:   'waiting',
  CALLED:    'called',
  SERVING:   'serving',
  COMPLETED: 'completed',
  SKIPPED:   'skipped',
  CANCELLED: 'cancelled',
});

const PRIORITY = Object.freeze({
  NORMAL:   'normal',
  PRIORITY: 'priority',
  VIP:      'vip',
});

const STAFF_ROLE = Object.freeze({
  OPERATOR:   'operator',
  SUPERVISOR: 'supervisor',
  ADMIN:      'admin',
});

const AUDIT_TYPE = Object.freeze({
  INFO:    'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ALERT:   'alert',
});

/**
 * Valid token status transitions.
 * Key = current status, value = array of allowed next statuses.
 */
const VALID_TRANSITIONS = Object.freeze({
  [TOKEN_STATUS.WAITING]:   [TOKEN_STATUS.CALLED,    TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.CALLED]:    [TOKEN_STATUS.SERVING,   TOKEN_STATUS.SKIPPED, TOKEN_STATUS.CANCELLED],
  [TOKEN_STATUS.SERVING]:   [TOKEN_STATUS.COMPLETED, TOKEN_STATUS.SKIPPED],
  [TOKEN_STATUS.SKIPPED]:   [TOKEN_STATUS.CALLED],   // recall
  [TOKEN_STATUS.COMPLETED]: [],
  [TOKEN_STATUS.CANCELLED]: [],
});

const WS_EVENTS = Object.freeze({
  TOKEN_CREATED:   'TOKEN_CREATED',
  TOKEN_CALLED:    'TOKEN_CALLED',
  TOKEN_SERVING:   'TOKEN_SERVING',
  TOKEN_COMPLETED: 'TOKEN_COMPLETED',
  TOKEN_SKIPPED:   'TOKEN_SKIPPED',
  TOKEN_RECALLED:  'TOKEN_RECALLED',
  TOKEN_CANCELLED: 'TOKEN_CANCELLED',
  TOKEN_DELAYED:   'TOKEN_DELAYED',
  SERVICE_UPDATED: 'SERVICE_UPDATED',
  STAFF_UPDATED:   'STAFF_UPDATED',
  SETTINGS_UPDATED:'SETTINGS_UPDATED',
  STATS_UPDATE:    'STATS_UPDATE',
});

const PRIORITY_ORDER = Object.freeze({
  [PRIORITY.VIP]:      3,
  [PRIORITY.PRIORITY]: 2,
  [PRIORITY.NORMAL]:   1,
});

const AUDIT_LOG_MAX_ROWS = 1000;
const AUDIT_LOG_PURGE_COUNT = 100;

module.exports = {
  TOKEN_STATUS,
  PRIORITY,
  STAFF_ROLE,
  AUDIT_TYPE,
  VALID_TRANSITIONS,
  WS_EVENTS,
  PRIORITY_ORDER,
  AUDIT_LOG_MAX_ROWS,
  AUDIT_LOG_PURGE_COUNT,
};
