'use strict';

const { z } = require('zod');

const createServiceSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1)
    .max(100)
    .transform((v) => v.trim()),
  description: z
    .string()
    .max(500)
    .default('')
    .transform((v) => v.trim()),
  prefix: z
    .string({ required_error: 'Prefix is required' })
    .regex(/^[A-Z]{1,2}$/, 'Prefix must be 1–2 uppercase letters')
    .transform((v) => v.toUpperCase()),
  avgServiceMinutes: z
    .number({ required_error: 'avgServiceMinutes is required' })
    .int()
    .min(1)
    .max(120),
  icon: z.string().max(50).default('Info'),
  color: z.string().max(50).default('emerald'),
  isActive: z.boolean().default(true),
  maxDailyCapacity: z.number().int().min(0).max(10000).nullable().optional(),
  priorityWeight: z.number().int().min(1).max(10).default(1),
});

const updateServiceSchema = createServiceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field required' }
);

module.exports = { createServiceSchema, updateServiceSchema };
