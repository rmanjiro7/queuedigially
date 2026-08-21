# CHANGELOG.md

---

## [2026-08-21] — v1.0.0 Initial Backend

### Added
- Complete backend project scaffolding under `backend/`
- SQLite database with full schema (admin_users, staff, services, tokens, settings, audit_logs)
- JWT authentication for admin (email+password) and staff (staffId+PIN)
- Full token lifecycle REST API: create, call-next, status updates, delay
- Service CRUD (admin only)
- Staff CRUD (admin only)
- Settings GET/PUT
- Audit log read endpoint
- Queue statistics endpoint
- Display board public read endpoint
- WebSocket server for real-time event broadcasting
- Zod input validation on all endpoints
- Central error handler with AppError class
- Rate limiting on public mutation endpoints
- CORS, Helmet security headers
- Demo data seeder
- Health check endpoint
- Complete /docs context system (14 files)

### Verified
- Fixed SQLite in-memory database handling for Jest test isolation
- Added service API integration coverage (public access, authorization, validation, CRUD, and deletion business rule)
- `npm test -- --silent`: 62 tests passing across 5 suites
- Running backend health and services endpoints verified on port 3001
- Split the React/Vite application into `frontend/`; the API remains in `backend/`
- Frontend production build and TypeScript validation pass from `frontend/`
