'use strict';

/**
 * validate.js — Zod schema validation middleware.
 *
 * Validates req.body against a Zod schema.
 * On failure, passes a ZodError to next() → caught by errorHandler.
 * On success, replaces req.body with the parsed (stripped) value.
 *
 * Usage:
 *   router.post('/route', validate(myZodSchema), controller.method);
 */

/**
 * @param {import('zod').ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error); // ZodError — handled by errorHandler
    }
    req.body = result.data; // Replace with parsed + coerced data
    next();
  };
}

module.exports = validate;
