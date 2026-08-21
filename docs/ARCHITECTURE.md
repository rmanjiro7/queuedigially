# ARCHITECTURE.md — System Architecture

## Overview

QueueDigially is a single-tenant queue management system. The frontend (React SPA) is deployed statically and communicates with the backend over HTTP REST + WebSocket. The backend is a Node.js/Express application backed by SQLite.

The repository keeps the applications separate: `frontend/` contains the Vite React app and `backend/` contains the API.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       CLIENTS                           │
│                                                         │
│  Customer Browser   Staff Terminal   Admin Portal       │
│  Display Board TV   Kiosk Tablet                        │
└──────────┬──────────────────────┬────────────────────────┘
           │  HTTP REST           │  WebSocket
           ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Middleware │  │   Routes     │  │  WS Server    │  │
│  │  - CORS      │  │  /api/v1/   │  │  (ws library) │  │
│  │  - Helmet    │  │             │  │               │  │
│  │  - Morgan    │  │             │  │               │  │
│  │  - RateLimit │  │             │  │               │  │
│  │  - Auth JWT  │  │             │  │               │  │
│  └─────────────┘  └──────┬───────┘  └───────┬───────┘  │
│                           │                  │          │
│                    ┌──────▼──────┐           │          │
│                    │ Controllers │           │          │
│                    └──────┬──────┘           │          │
│                           │                  │          │
│                    ┌──────▼──────┐           │          │
│                    │  Services   │◄──────────┘          │
│                    │ (business   │  broadcasts           │
│                    │  logic)     │                      │
│                    └──────┬──────┘                      │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │Repositories │                      │
│                    └──────┬──────┘                      │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │   SQLite DB │                      │
│                    │  (better-   │                      │
│                    │  sqlite3)   │                      │
│                    └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # DB connection + migrations
│   │   ├── env.js           # Validated env variables
│   │   └── logger.js        # Structured logger
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── tokens.routes.js
│   │   ├── services.routes.js
│   │   ├── staff.routes.js
│   │   ├── settings.routes.js
│   │   ├── auditLogs.routes.js
│   │   ├── stats.routes.js
│   │   └── display.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── tokens.controller.js
│   │   ├── services.controller.js
│   │   ├── staff.controller.js
│   │   ├── settings.controller.js
│   │   ├── auditLogs.controller.js
│   │   ├── stats.controller.js
│   │   └── display.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── queue.service.js
│   │   ├── services.service.js
│   │   ├── staff.service.js
│   │   ├── settings.service.js
│   │   └── auditLog.service.js
│   ├── repositories/
│   │   ├── token.repository.js
│   │   ├── service.repository.js
│   │   ├── staff.repository.js
│   │   ├── settings.repository.js
│   │   └── auditLog.repository.js
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT verify + role attach
│   │   ├── requireRole.js         # Role-based guard
│   │   ├── validate.js            # Zod schema validator
│   │   ├── errorHandler.js        # Central error handler
│   │   └── rateLimiter.js         # express-rate-limit configs
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── token.validators.js
│   │   ├── service.validators.js
│   │   ├── staff.validators.js
│   │   └── settings.validators.js
│   ├── utils/
│   │   ├── tokenNumber.js         # Prefix-NNN generator
│   │   ├── waitTime.js            # Wait time estimation
│   │   ├── response.js            # Standard response helpers
│   │   └── seed.js                # Demo data seeder
│   ├── constants/
│   │   └── index.js               # Enums, role constants
│   ├── websocket/
│   │   └── wsBroadcast.js         # WS server + broadcast
│   ├── app.js                     # Express app setup
│   └── server.js                  # HTTP + WS server start
├── data/                          # SQLite DB file (gitignored)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Data Flow Examples

### Customer Creates Token
```
POST /api/v1/tokens
  → validate(tokenSchema)
  → TokensController.create()
  → QueueService.createToken()
  → TokenRepository.insert()
  → AuditLogService.log()
  → wsBroadcast({ event: 'TOKEN_CREATED', token })
  → 201 { success: true, data: token }
```

### Staff Calls Next Token
```
POST /api/v1/tokens/call-next
  → authMiddleware (JWT required, role: staff)
  → TokensController.callNext()
  → QueueService.callNextToken(staffId, serviceFilter)
  → TokenRepository.updateStatus('called')
  → AuditLogService.log()
  → wsBroadcast({ event: 'TOKEN_CALLED', token })
  → 200 { success: true, data: calledToken }
```

---

## Real-time WebSocket Protocol

Events broadcast from server to all connected clients:

| Event | Trigger | Payload |
|-------|---------|---------|
| `TOKEN_CREATED` | New token issued | `{ token }` |
| `TOKEN_CALLED` | Staff calls next | `{ token }` |
| `TOKEN_SERVING` | Customer arrived | `{ token }` |
| `TOKEN_COMPLETED` | Service done | `{ token }` |
| `TOKEN_SKIPPED` | No-show | `{ token }` |
| `TOKEN_RECALLED` | Recall skipped token | `{ token }` |
| `TOKEN_CANCELLED` | Customer cancels | `{ token }` |
| `TOKEN_DELAYED` | +5m delay requested | `{ token }` |
| `SERVICE_UPDATED` | Service CRUD | `{ service }` |
| `STAFF_UPDATED` | Staff CRUD | `{ staff }` |
| `SETTINGS_UPDATED` | Settings changed | `{ settings }` |
| `STATS_UPDATE` | Periodic stats push | `{ stats }` |

---

## API Base URL
```
/api/v1/
```

## Port
Default: `3001` (configurable via `PORT` env var). Frontend dev proxy routes `/api` to `3001`.
