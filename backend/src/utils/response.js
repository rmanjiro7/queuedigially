'use strict';

/**
 * response.js — Standard HTTP response helpers.
 * All API responses use the same envelope for consistency.
 */

/**
 * Success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
const success = (res, data = null, message = 'OK', statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Created response (201).
 */
const created = (res, data, message = 'Created') => {
  return success(res, data, message, 201);
};

/**
 * No content response (204).
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {string} [code]
 * @param {Array} [errors]
 */
const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', errors = []) => {
  const body = { success: false, message, code };
  if (errors.length > 0) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, noContent, error };
