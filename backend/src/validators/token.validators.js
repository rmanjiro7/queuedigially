'use strict';

const { z } = require('zod');
const { TOKEN_STATUS, PRIORITY } = require('../constants');

const createTokenSchema = z.object({
  serviceId: z
    .string({ required_error: 'serviceId is required' })
    .min(1, 'serviceId required'),
  customerName: z
    .string({ required_error: 'customerName is required' })
    .min(1, 'Customer name required')
    .max(100, 'Customer name too long')
    .transform((v) => v.trim()),
  customerPhone: z
    .string()
    .max(30, 'Phone number too long')
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
  customerEmail: z
    .string()
    .email('Must be a valid email address')
    .max(150)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
  notes: z
    .string()
    .max(500, 'Notes too long')
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
  priority: z
    .enum([PRIORITY.NORMAL, PRIORITY.PRIORITY, PRIORITY.VIP], {
      errorMap: () => ({ message: 'Priority must be: normal, priority, or vip' }),
    })
    .default(PRIORITY.NORMAL),
});

const updateTokenStatusSchema = z.object({
  status: z.enum(
    [TOKEN_STATUS.SERVING, TOKEN_STATUS.COMPLETED, TOKEN_STATUS.SKIPPED, TOKEN_STATUS.CANCELLED],
    { errorMap: () => ({ message: 'Status must be: serving, completed, skipped, or cancelled' }) }
  ),
});

const callNextSchema = z.object({
  serviceIdFilter: z.string().min(1).optional(),
});

const delayTokenSchema = z.object({
  extraMinutes: z
    .number()
    .int('Must be an integer')
    .min(1, 'Minimum 1 minute')
    .max(30, 'Maximum 30 minutes')
    .default(5),
});

module.exports = { createTokenSchema, updateTokenStatusSchema, callNextSchema, delayTokenSchema };
