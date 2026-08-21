'use strict';

const settingsRepository = require('../repositories/settings.repository');
const auditLogService = require('./auditLog.service');
const { broadcast } = require('../websocket/wsBroadcast');
const { WS_EVENTS, AUDIT_TYPE } = require('../constants');

const settingsService = {
  get() {
    return settingsRepository.get();
  },

  update(data, actorEmail) {
    // Flatten nested operatingHours into repository-level fields
    const flatFields = {};

    if (data.organizationName !== undefined) flatFields.organizationName = data.organizationName;
    if (data.venueName !== undefined) flatFields.venueName = data.venueName;
    if (data.operatingHours) {
      if (data.operatingHours.start !== undefined) flatFields.opHoursStart = data.operatingHours.start;
      if (data.operatingHours.end !== undefined) flatFields.opHoursEnd = data.operatingHours.end;
      if (data.operatingHours.daysOpen !== undefined) flatFields.daysOpen = data.operatingHours.daysOpen;
    }
    if (data.enableSoundAlerts !== undefined) flatFields.enableSoundAlerts = data.enableSoundAlerts;
    if (data.enableSpeechAnnouncements !== undefined) flatFields.enableSpeechAnnouncements = data.enableSpeechAnnouncements;
    if (data.voiceType !== undefined) flatFields.voiceType = data.voiceType;
    if (data.maxQueueSize !== undefined) flatFields.maxQueueSize = data.maxQueueSize;
    if (data.autoCallNextOnComplete !== undefined) flatFields.autoCallNextOnComplete = data.autoCallNextOnComplete;
    if (data.smsAlertsEnabled !== undefined) flatFields.smsAlertsEnabled = data.smsAlertsEnabled;
    if (data.vipPriorityMultiplier !== undefined) flatFields.vipPriorityMultiplier = data.vipPriorityMultiplier;
    if (data.theme !== undefined) flatFields.theme = data.theme;

    const updated = settingsRepository.update(flatFields);

    auditLogService.log({
      action: 'Settings Updated',
      actor: actorEmail || 'Administrator',
      details: 'Updated global queue configuration',
      type: AUDIT_TYPE.INFO,
    });

    broadcast(WS_EVENTS.SETTINGS_UPDATED, updated);
    return updated;
  },
};

module.exports = settingsService;
