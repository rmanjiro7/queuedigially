'use strict';

const { z } = require('zod');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_REGEX = /^\d{2}:\d{2}$/;

const updateSettingsSchema = z
  .object({
    organizationName: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
    venueName: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
    operatingHours: z
      .object({
        start: z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
        end: z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
        daysOpen: z.array(z.enum(DAYS)).optional(),
      })
      .optional(),
    enableSoundAlerts: z.boolean().optional(),
    enableSpeechAnnouncements: z.boolean().optional(),
    voiceType: z.string().max(50).optional(),
    maxQueueSize: z.number().int().min(1).max(10000).optional(),
    autoCallNextOnComplete: z.boolean().optional(),
    smsAlertsEnabled: z.boolean().optional(),
    vipPriorityMultiplier: z.number().min(1).max(10).optional(),
    theme: z.enum(['dark-navy', 'light', 'corporate']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

module.exports = { updateSettingsSchema };
