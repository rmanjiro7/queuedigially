# TODO.md — Implementation Tracker

---

## Backend v1 — COMPLETE ✓

### Infrastructure
- [x] /docs context system created (14 files)
- [x] backend/ folder structure created
- [x] backend/package.json with dependencies
- [x] backend/.env.example
- [x] backend/src/config/env.js
- [x] backend/src/config/database.js (schema + migrations via node:sqlite)
- [x] backend/src/config/logger.js
- [x] backend/src/app.js
- [x] backend/src/server.js

### Auth Module — COMPLETE ✓
- [x] backend/src/validators/auth.validators.js
- [x] backend/src/services/auth.service.js (admin+staff, bcrypt, JWT, audit logs)
- [x] backend/src/controllers/auth.controller.js
- [x] backend/src/routes/auth.routes.js
- [x] backend/src/middlewares/auth.middleware.js
- [x] backend/src/middlewares/requireRole.js

### Token / Queue Module — COMPLETE ✓
- [x] backend/src/utils/tokenNumber.js
- [x] backend/src/utils/waitTime.js
- [x] backend/src/validators/token.validators.js
- [x] backend/src/repositories/token.repository.js
- [x] backend/src/services/queue.service.js (full lifecycle + business rules)
- [x] backend/src/controllers/tokens.controller.js
- [x] backend/src/routes/tokens.routes.js

### Service Module — COMPLETE ✓
- [x] backend/src/validators/service.validators.js
- [x] backend/src/repositories/service.repository.js
- [x] backend/src/services/services.service.js
- [x] backend/src/controllers/services.controller.js
- [x] backend/src/routes/services.routes.js

### Staff Module — COMPLETE ✓
- [x] backend/src/validators/staff.validators.js
- [x] backend/src/repositories/staff.repository.js
- [x] backend/src/services/staff.service.js
- [x] backend/src/controllers/staff.controller.js
- [x] backend/src/routes/staff.routes.js

### Settings Module — COMPLETE ✓
- [x] backend/src/validators/settings.validators.js
- [x] backend/src/repositories/settings.repository.js
- [x] backend/src/services/settings.service.js
- [x] backend/src/controllers/settings.controller.js
- [x] backend/src/routes/settings.routes.js

### Audit Logs Module — COMPLETE ✓
- [x] backend/src/repositories/auditLog.repository.js
- [x] backend/src/services/auditLog.service.js
- [x] backend/src/controllers/auditLogs.controller.js
- [x] backend/src/routes/auditLogs.routes.js

### Stats & Display — COMPLETE ✓
- [x] backend/src/controllers/stats.controller.js
- [x] backend/src/routes/stats.routes.js
- [x] backend/src/controllers/display.controller.js
- [x] backend/src/routes/display.routes.js

### WebSocket — COMPLETE ✓
- [x] backend/src/websocket/wsBroadcast.js

### Middleware & Utils — COMPLETE ✓
- [x] backend/src/middlewares/validate.js
- [x] backend/src/middlewares/errorHandler.js (AppError class)
- [x] backend/src/middlewares/rateLimiter.js
- [x] backend/src/utils/response.js
- [x] backend/src/utils/seed.js (demo data)
- [x] backend/src/constants/index.js

### Tests
- [x] backend/tests/unit/tokenNumber.test.js
- [x] backend/tests/unit/waitTime.test.js
- [x] backend/tests/integration/auth.test.js
- [x] backend/tests/integration/tokens.test.js
- [x] backend/tests/integration/services.test.js

### Documentation — COMPLETE ✓
- [x] backend/README.md
- [x] All 14 /docs files

---

## v2 Backlog (Future)
- [ ] Real email delivery for password reset (SendGrid/Postmark)
- [ ] Refresh token support
- [ ] SMS notification integration (Twilio)
- [ ] Multi-tenant support
- [ ] Data export (CSV/Excel)
- [ ] Metrics / Prometheus endpoint
- [ ] Docker Compose file
- [ ] Frontend API integration (replace localStorage with real API calls)
