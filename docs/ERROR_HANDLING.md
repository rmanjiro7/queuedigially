# ERROR_HANDLING.md — Error Handling Specification

---

## Standard Error Response Envelope

All errors use this consistent structure:

```json
{
  "success": false,
  "message": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "errors": []
}
```

`errors` array is populated for validation failures:
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "customerName", "message": "Required" },
    { "field": "priority", "message": "Must be one of: normal, priority, vip" }
  ]
}
```

---

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed request (invalid JSON, missing required params) |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Valid JWT but insufficient role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business rule violation (invalid status transition, duplicate prefix, service has active tokens) |
| 422 | Unprocessable Entity | Validation schema failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## Error Codes (machine-readable)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Zod schema validation failed |
| `UNAUTHORIZED` | 401 | No or invalid JWT |
| `FORBIDDEN` | 403 | Role insufficient |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Business rule violation |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password or PIN |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `QUEUE_FULL` | 409 | maxQueueSize reached |
| `SERVICE_INACTIVE` | 409 | Service is inactive |
| `CAPACITY_REACHED` | 409 | maxDailyCapacity reached |
| `INVALID_TRANSITION` | 409 | Invalid token status transition |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Central Error Handler

Located at `src/middlewares/errorHandler.js`. All errors flow through it via `next(err)`.

```js
// Usage in controllers:
try {
  // ... operation
} catch (err) {
  next(err);
}

// Custom error class:
throw new AppError('Service not found', 404, 'NOT_FOUND');
```

The `AppError` class carries `message`, `statusCode`, and `code`.

---

## What Is NEVER Returned in Production

- Stack traces
- Database error messages (e.g. SQLite constraint text)
- File paths
- Internal variable names
- JWT secret or any secret value

In `NODE_ENV=production`:
- All 500 errors return: `{ "success": false, "message": "An unexpected error occurred", "code": "INTERNAL_ERROR" }`
- Error is logged server-side with full details

In `NODE_ENV=development`:
- 500 errors include `stack` field in response for debugging
