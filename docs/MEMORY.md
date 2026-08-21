# PROJECT MEMORY

## Current State
- Backend v1: **COMPLETE and running**
- Server: `node src/server.js` on port 3001
- All 40 API verification checks pass
- Jest suite passes: 62 tests across 5 suites

## Completed
- Full Express backend under `backend/src/`
- SQLite via `node:sqlite` (built-in Node 22+, zero compilation)
- JWT auth: admin (email+password) + staff (staffId+PIN)
- All token lifecycle endpoints (create/call/serve/complete/skip/recall/cancel/delay)
- Services, Staff, Settings CRUD (admin-only mutations)
- Audit log (append-only, admin read)
- Queue stats endpoint
- Display board public endpoint
- WebSocket broadcast on every state mutation
- Zod validation on all inputs
- Central error handler (AppError class)
- Rate limiting (skipped in dev/test)
- CORS + Helmet security headers
- Demo data seed (runs on empty DB)
- 14 /docs context files
- backend/README.md
- Jest unit and integration test suite (62 passing tests)

## In Progress
- No active backend implementation work

## Important Decisions
- `node:sqlite` used instead of `better-sqlite3` — avoids C++ compilation on Windows (no Visual Studio)
- Named params use `$name` syntax (node:sqlite style)
- Rate limiter skips in `NODE_ENV=development` AND `test`
- JWT TTL = 8h, bcrypt rounds: admin=12, staff=10
- Token numbers: `{PREFIX}-{NNN}` resetting daily at midnight
- Single-tenant, single-row settings table (always id=1)
- Audit log capped at 1000 rows, purges oldest 100 on overflow

## Important Constraints
- Node.js v24 required (node:sqlite)
- No Visual Studio / C++ build tools on this machine — avoid any native module
- Frontend is still localStorage-based; backend is additive/parallel
- `.env` file exists at `backend/.env` with dev credentials (not committed)
- Frontend and backend are separate applications under `frontend/` and `backend/`.

## Known Issues
- None

## Next Actions
1. Integrate the frontend with the backend API when moving to v2.
2. Select and configure external providers before enabling the v2 notification features.

## Important Files
| File | Purpose |
|------|---------|
| `backend/src/server.js` | Entry point — loads .env, starts HTTP+WS server |
| `backend/src/app.js` | Express app, all middleware + route mounts |
| `backend/src/config/database.js` | node:sqlite connection + DDL migrations |
| `backend/src/config/env.js` | Validated env vars (throws on missing required) |
| `backend/src/constants/index.js` | TOKEN_STATUS, VALID_TRANSITIONS, WS_EVENTS enums |
| `backend/src/services/queue.service.js` | Core queue business logic + WS broadcast |
| `backend/src/services/auth.service.js` | JWT issuance, bcrypt comparison |
| `backend/src/middlewares/errorHandler.js` | AppError class + central error handler |
| `backend/src/middlewares/rateLimiter.js` | Rate limiters (skipped in dev/test) |
| `backend/src/utils/seed.js` | Demo data seed (idempotent) |
| `frontend/` | Vite React application; run with `npm run dev` from this directory |
| `backend/tests/fixtures/seed.js` | Isolated in-memory SQLite test fixture |
| `backend/tests/integration/services.test.js` | Service CRUD, validation, authorization, and deletion-rule coverage |
| `backend/data/queuedigially.db` | Live SQLite DB file (gitignored) |
| `docs/API_CONTRACT.md` | Full API spec |
| `docs/BUSINESS_RULES.md` | All enforced business rules |
| `docs/DATABASE.md` | Schema reference |
