'use strict';

const { z } = require('zod');

const adminLoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .max(150, 'Email too long')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(200, 'Password too long'),
});

const staffLoginSchema = z.object({
  staffId: z
    .string({ required_error: 'Staff ID is required' })
    .min(1, 'Staff ID required')
    .max(50),
  pin: z
    .string({ required_error: 'PIN is required' })
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 numeric digits'),
  counter: z.string().max(50).optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .max(150)
    .transform((v) => v.toLowerCase().trim()),
});

module.exports = { adminLoginSchema, staffLoginSchema, forgotPasswordSchema };
