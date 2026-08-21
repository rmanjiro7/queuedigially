# CONTEXT.md — QueueDigially Project Memory

## Project Name
QueueDigially (branded: QueueFlow)

## Purpose
A digital queue management system for physical service venues (banks, hospitals, government offices, retail). Customers take virtual tokens, staff call the next customer, and a lobby display board shows live queue status. Eliminates physical queuing.

## Target Users
| Role | Description |
|------|-------------|
| Customer | Anonymous walk-in visitor. Gets a digital token, tracks live position. |
| Staff Operator | Service desk agent. Calls, serves, skips, recalls tokens. |
| Staff Supervisor | Same as operator with broader service access. |
| Admin | Organization administrator. Manages services, staff, and settings. |

## Core Modules
1. **Auth** — JWT-based admin login (email+password) and staff login (staffId+PIN)
2. **Queue Tokens** — Full lifecycle: waiting → called → serving → completed/skipped/cancelled
3. **Services** — Service department configuration (prefix, avg time, capacity)
4. **Staff** — Staff roster, counters, role assignments
5. **Settings** — Organization-wide configuration
6. **Audit Logs** — Immutable append-only system event log
7. **Display Board** — Public read endpoint for lobby TV signage
8. **Real-time** — WebSocket broadcast for live sync across devices/tabs

## Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 4, TypeScript |
| Database | SQLite via `better-sqlite3` (single file, zero-config) |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| Real-time | WebSocket (`ws` library) |
| Validation | `zod` |
| Logging | `morgan` (HTTP) + structured console logger |

## Backend Architecture
REST API under `/api/v1/` + WebSocket on same HTTP server port.

```
Request → Express Router → Middleware (auth/validate) → Controller → Service → Repository → SQLite
                                                                         ↓
                                                                   WebSocket Broadcast
```

## Database
SQLite, file at `backend/data/queuedigially.db`. Seeded with initial data on first run.

## Authentication Strategy
- Admin: `POST /api/v1/auth/admin/login` → JWT (role: `admin`)
- Staff: `POST /api/v1/auth/staff/login` → JWT (role: `operator|supervisor|admin`)
- JWT secret from `JWT_SECRET` env var. Token TTL: 8 hours.
- Tokens sent as `Authorization: Bearer <token>` header.

## Authorization Strategy
- Public endpoints: create token (customer), display board reads, kiosk token create
- Staff-authenticated: queue actions (call, serve, skip, recall, complete)
- Admin-authenticated: CRUD services, staff, settings, audit logs, stats

## Important Constraints
- Single-tenant (one organization per deployment)
- Frontend can remain fully localStorage-based; backend is additive/parallel
- No file uploads in v1
- No payment integration in v1

## Current Status
**Phase 1 — Backend v1 implementation in progress.**
