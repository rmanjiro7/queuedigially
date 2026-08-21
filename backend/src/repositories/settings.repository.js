'use strict';

const db = require('../config/database');

function rowToSettings(row) {
  if (!row) return null;
  return {
    organizationName: row.organization_name,
    venueName: row.venue_name,
    operatingHours: {
      start: row.op_hours_start,
      end: row.op_hours_end,
      daysOpen: JSON.parse(row.days_open || '[]'),
    },
    enableSoundAlerts: row.enable_sound_alerts === 1,
    enableSpeechAnnouncements: row.enable_speech_announcements === 1,
    voiceType: row.voice_type,
    maxQueueSize: row.max_queue_size,
    autoCallNextOnComplete: row.auto_call_next_on_complete === 1,
    smsAlertsEnabled: row.sms_alerts_enabled === 1,
    vipPriorityMultiplier: row.vip_priority_multiplier,
    theme: row.theme,
    updatedAt: row.updated_at,
  };
}

const settingsRepository = {
  get() {
    return rowToSettings(db.prepare('SELECT * FROM settings WHERE id = 1').get({}));
  },

  update(fields) {
    const columnMap = {
      organizationName:          'organization_name',
      venueName:                 'venue_name',
      opHoursStart:              'op_hours_start',
      opHoursEnd:                'op_hours_end',
      daysOpen:                  'days_open',
      enableSoundAlerts:         'enable_sound_alerts',
      enableSpeechAnnouncements: 'enable_speech_announcements',
      voiceType:                 'voice_type',
      maxQueueSize:              'max_queue_size',
      autoCallNextOnComplete:    'auto_call_next_on_complete',
      smsAlertsEnabled:          'sms_alerts_enabled',
      vipPriorityMultiplier:     'vip_priority_multiplier',
      theme:                     'theme',
    };

    const setClauses = [];
    const params = { $updatedAt: Date.now() };

    Object.entries(fields).forEach(([key, value]) => {
      const col = columnMap[key];
      if (col) {
        setClauses.push(`${col} = $${key}`);
        if (typeof value === 'boolean') params[`$${key}`] = value ? 1 : 0;
        else if (Array.isArray(value)) params[`$${key}`] = JSON.stringify(value);
        else params[`$${key}`] = value;
      }
    });

    if (setClauses.length === 0) return this.get();
    db.prepare(`UPDATE settings SET ${setClauses.join(', ')}, updated_at = $updatedAt WHERE id = 1`).run(params);
    return this.get();
  },
};

module.exports = settingsRepository;
