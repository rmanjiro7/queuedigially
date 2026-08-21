# VALIDATION.md — Validation Rules

All validation uses Zod schemas. The `validate(schema)` middleware parses and strips unknown fields before the controller runs.

---

## Token Creation (POST /api/v1/tokens)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| serviceId | string | Yes | Must exist in DB, must be active |
| customerName | string | Yes | Min 1, max 100 chars, trimmed |
| customerPhone | string | No | E.164-like format if provided, max 30 chars |
| customerEmail | string | No | Valid email format if provided, max 150 chars |
| notes | string | No | Max 500 chars |
| priority | enum | No | `normal` \| `priority` \| `vip`. Default: `normal` |

---

## Token Status Update (PATCH /api/v1/tokens/:id/status)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| status | enum | Yes | `serving` \| `completed` \| `skipped` \| `recalled` \| `cancelled` |

Business rule: status transition must be valid per BR-008.

---

## Token Delay (PATCH /api/v1/tokens/:id/delay)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| extraMinutes | integer | No | Min 1, max 30. Default: 5 |

---

## Admin Login (POST /api/v1/auth/admin/login)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| email | string | Yes | Valid email format, max 150 chars, lowercased |
| password | string | Yes | Min 6, max 200 chars |

---

## Staff Login (POST /api/v1/auth/staff/login)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| staffId | string | Yes | Non-empty, max 50 chars |
| pin | string | Yes | Exactly 4 chars, numeric |
| counter | string | No | Max 50 chars (e.g. "Counter 03") |

---

## Service Create/Update (POST/PUT /api/v1/services)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | Min 1, max 100 chars |
| description | string | No | Max 500 chars |
| prefix | string | Yes (create) | 1–2 uppercase letters (`/^[A-Z]{1,2}$/`) |
| avgServiceMinutes | integer | Yes (create) | Min 1, max 120 |
| icon | string | No | Max 50 chars, default `Info` |
| color | string | No | Max 50 chars, default `emerald` |
| isActive | boolean | No | Default `true` |
| maxDailyCapacity | integer | No | Min 0, max 10000, nullable |
| priorityWeight | integer | No | Min 1, max 10 |

---

## Staff Create (POST /api/v1/staff)

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | Min 1, max 100 chars |
| email | string | Yes | Valid email, unique |
| role | enum | Yes | `operator` \| `supervisor` \| `admin` |
| assignedCounter | string | Yes | Max 50 chars |
| assignedServiceIds | array | Yes | Array of valid service ID strings |
| pin | string | Yes | Exactly 4 numeric chars |
| avatarUrl | string | No | Valid URL if provided, max 500 chars |

---

## Staff Update (PUT /api/v1/staff/:id)

All fields optional. Same rules as create. If `pin` is provided, it is re-hashed.

---

## Settings Update (PUT /api/v1/settings)

| Field | Type | Rules |
|-------|------|-------|
| organizationName | string | Max 200 |
| venueName | string | Max 200 |
| operatingHours.start | string | HH:MM format |
| operatingHours.end | string | HH:MM format |
| operatingHours.daysOpen | array | Array of `Mon`\|`Tue`\|`Wed`\|`Thu`\|`Fri`\|`Sat`\|`Sun` |
| enableSoundAlerts | boolean | — |
| enableSpeechAnnouncements | boolean | — |
| voiceType | string | Max 50 |
| maxQueueSize | integer | Min 1, max 10000 |
| autoCallNextOnComplete | boolean | — |
| smsAlertsEnabled | boolean | — |
| vipPriorityMultiplier | number | Min 1, max 10 |
| theme | enum | `dark-navy` \| `light` \| `corporate` |

---

## Query Parameter Validation

Validated inline in controllers (not via Zod middleware since they're GET params):

- `limit`: integer, min 1, max 200, default 50
- `offset`: integer, min 0, default 0
- `status`: valid TokenStatus enum value
- `date`: YYYY-MM-DD format
- `type`: valid AuditLog type enum
