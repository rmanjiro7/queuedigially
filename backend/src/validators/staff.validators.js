'use strict';

const { z } = require('zod');
const { STAFF_ROLE } = require('../constants');

const createStaffSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1)
    .max(100)
    .transform((v) => v.trim()),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .max(150)
    .transform((v) => v.toLowerCase().trim()),
  role: z.enum([STAFF_ROLE.OPERATOR, STAFF_ROLE.SUPERVISOR, STAFF_ROLE.ADMIN], {
    errorMap: () => ({ message: 'Role must be: operator, supervisor, or admin' }),
  }),
  assignedCounter: z
    .string({ required_error: 'assignedCounter is required' })
    .min(1)
    .max(50)
    .transform((v) => v.trim()),
  assignedServiceIds: z
    .array(z.string().min(1))
    .default([]),
  pin: z
    .string({ required_error: 'PIN is required' })
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
  avatarUrl: z
    .string()
    .url('Must be a valid URL')
    .max(500)
    .optional()
    .nullable(),
});

const updateStaffSchema = createStaffSchema
  .omit({ pin: true })
  .extend({ pin: z.string().length(4).regex(/^\d{4}$/).optional() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const onlineStatusSchema = z.object({
  isOnline: z.boolean({ required_error: 'isOnline is required' }),
  assignedCounter: z.string().max(50).optional(),
});

module.exports = { createStaffSchema, updateStaffSchema, onlineStatusSchema };
