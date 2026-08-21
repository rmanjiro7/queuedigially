# API_CONTRACT.md — Backend API Specification

Base URL: `/api/v1`
All responses use the standard envelope:
```json
{ "success": true|false, "data": {}, "message": "", "errors": [] }
```

---

## Auth

### POST /api/v1/auth/admin/login
- **Auth:** Public
- **Request:** `{ "email": string, "password": string }`
- **Response 200:** `{ "token": string, "admin": { "id", "email", "role": "admin" } }`
- **Errors:** 401 Invalid credentials

### POST /api/v1/auth/staff/login
- **Auth:** Public
- **Request:** `{ "staffId": string, "pin": string, "counter": string (optional) }`
- **Response 200:** `{ "token": string, "staff": { "id", "name", "role", "assignedCounter", "assignedServiceIds" } }`
- **Errors:** 401 Invalid PIN

### POST /api/v1/auth/admin/forgot-password
- **Auth:** Public
- **Request:** `{ "email": string }`
- **Response 200:** `{ "message": "Reset link sent if email exists" }`
- **Note:** Stub in v1 — logs request, no actual email.

### GET /api/v1/auth/me
- **Auth:** Bearer JWT (any role)
- **Response 200:** `{ "id", "name"|"email", "role" }`

---

## Tokens

### POST /api/v1/tokens
- **Auth:** Public (rate-limited: 10/min per IP)
- **Request:**
```json
{
  "serviceId": "srv-1",
  "customerName": "Alex Rivera",
  "customerPhone": "+1 (555) 789-0123",
  "customerEmail": "alex@example.com",
  "notes": "New account setup",
  "priority": "normal" | "priority" | "vip"
}
```
- **Response 201:** `{ token object }`
- **Validation:** serviceId required, exists, isActive; customerName required max 100; priority enum

### GET /api/v1/tokens
- **Auth:** Bearer JWT (staff or admin)
- **Query:** `?status=waiting|called|serving|completed|skipped|cancelled`, `?serviceId=`, `?date=YYYY-MM-DD`, `?limit=50&offset=0`
- **Response 200:** `{ "data": [ token[] ], "total": number }`

### GET /api/v1/tokens/:tokenNumber
- **Auth:** Public
- **Param:** tokenNumber e.g. `A-042`
- **Response 200:** `{ token object }`
- **Errors:** 404 Not found

### POST /api/v1/tokens/call-next
- **Auth:** Bearer JWT (staff)
- **Request:** `{ "serviceIdFilter": string (optional) }`
- **Response 200:** `{ token object (status: called) }` or `{ "message": "Queue is empty" }` 204
- **Business rule:** Calls highest-priority waiting token eligible for this staff member

### PATCH /api/v1/tokens/:id/status
- **Auth:** Bearer JWT (staff)
- **Request:** `{ "status": "serving"|"completed"|"skipped"|"recalled"|"cancelled" }`
- **Response 200:** `{ token object }`
- **Business rule:** Status transitions validated (cannot complete a waiting token directly)

### PATCH /api/v1/tokens/:id/delay
- **Auth:** Public (customer self-service)
- **Request:** `{ "extraMinutes": 5 }`
- **Response 200:** `{ token object }`

---

## Services

### GET /api/v1/services
- **Auth:** Public
- **Response 200:** `{ "data": [ service[] ] }`

### POST /api/v1/services
- **Auth:** Bearer JWT (admin)
- **Request:** `{ "name", "description", "prefix", "avgServiceMinutes", "icon", "color", "isActive", "maxDailyCapacity", "priorityWeight" }`
- **Response 201:** `{ service object }`

### PUT /api/v1/services/:id
- **Auth:** Bearer JWT (admin)
- **Request:** Partial service fields
- **Response 200:** `{ service object }`

### DELETE /api/v1/services/:id
- **Auth:** Bearer JWT (admin)
- **Response 204:** No content
- **Business rule:** Cannot delete a service that has active (waiting/called/serving) tokens

---

## Staff

### GET /api/v1/staff
- **Auth:** Bearer JWT (admin or supervisor)
- **Response 200:** `{ "data": [ staffMember[] ] }` (PIN field never returned)

### POST /api/v1/staff
- **Auth:** Bearer JWT (admin)
- **Request:** `{ "name", "email", "role", "assignedCounter", "assignedServiceIds", "pin" }`
- **Response 201:** `{ staff object (no PIN) }`

### PUT /api/v1/staff/:id
- **Auth:** Bearer JWT (admin)
- **Request:** Partial staff fields (if pin provided, re-hash it)
- **Response 200:** `{ staff object }`

### DELETE /api/v1/staff/:id
- **Auth:** Bearer JWT (admin)
- **Response 204**

### PATCH /api/v1/staff/:id/online-status
- **Auth:** Bearer JWT (staff — own record only, or admin)
- **Request:** `{ "isOnline": boolean, "assignedCounter": string (optional) }`
- **Response 200:** `{ staff object }`

---

## Settings

### GET /api/v1/settings
- **Auth:** Public (org name, venue used by display board)
- **Response 200:** `{ settings object }`

### PUT /api/v1/settings
- **Auth:** Bearer JWT (admin)
- **Request:** Partial settings fields
- **Response 200:** `{ settings object }`

---

## Audit Logs

### GET /api/v1/audit-logs
- **Auth:** Bearer JWT (admin)
- **Query:** `?limit=50&offset=0&type=info|success|warning|alert`
- **Response 200:** `{ "data": [ log[] ], "total": number }`

---

## Statistics

### GET /api/v1/stats
- **Auth:** Bearer JWT (admin or supervisor)
- **Response 200:**
```json
{
  "totalToday": 47,
  "waiting": 5,
  "serving": 2,
  "completed": 38,
  "skipped": 2,
  "cancelled": 0,
  "avgWaitMinutes": 7.8,
  "avgServiceMinutes": 6.4,
  "byService": [ { "serviceId", "name", "count", "waiting" } ]
}
```

---

## Display Board

### GET /api/v1/display
- **Auth:** Public (rate-limited: 30/min per IP)
- **Response 200:**
```json
{
  "nowServing": [ token[] ],
  "upNext": [ token[] (max 5) ],
  "completedCount": number,
  "settings": { "organizationName", "venueName" },
  "lastCalledToken": token | null
}
```

---

## Admin Utilities

### POST /api/v1/admin/reset-demo
- **Auth:** Bearer JWT (admin)
- **Response 200:** `{ "message": "Demo data restored" }`

---

## Health

### GET /api/v1/health
- **Auth:** Public
- **Response 200:** `{ "status": "ok", "timestamp": ISO8601, "uptime": seconds }`

---

## WebSocket

### Connection
```
ws://host:PORT  (same port as HTTP server, upgraded via Express)
```

### Client → Server (optional ping)
```json
{ "type": "PING" }
```

### Server → Client (broadcasts)
```json
{ "event": "TOKEN_CALLED", "data": { ...token }, "timestamp": 1234567890 }
```
See ARCHITECTURE.md for full event list.
