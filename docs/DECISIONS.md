# DECISIONS.md — Architecture Decision Log

---

## DEC-001 — SQLite over PostgreSQL/MongoDB
- **Decision:** Use SQLite via `better-sqlite3` as the database.
- **Why:** This is a single-tenant SPA backend. SQLite is zero-config, ships as a single file, has no separate process, and is trivially deployable. The data volume (hundreds to low thousands of tokens per day) is well within SQLite's performance envelope. Upgrading to Postgres later requires only changing the repository layer.
- **Alternatives considered:** PostgreSQL (operational overhead), MongoDB (schema-less not needed, adds complexity), in-memory (no persistence).
- **Impact:** All queries are synchronous via `better-sqlite3`. Repository layer is isolated from the rest of the stack.
- **Date:** 2026-08-21

## DEC-002 — JWT Access Token Only (No Refresh Token)
- **Decision:** Issue a single JWT access token with 8-hour TTL. No refresh token in v1.
- **Why:** Staff sessions are bound to a work shift (~8 hours). The overhead of refresh token rotation adds complexity with minimal benefit for this use case. Display board and kiosk are public (no token required).
- **Alternatives considered:** Session cookies (CSRF complexity), refresh tokens (added complexity).
- **Impact:** Token expiry after 8h requires re-login. Acceptable for shift-based staff usage.
- **Date:** 2026-08-21

## DEC-003 — WebSocket on Same HTTP Port
- **Decision:** Attach the `ws` WebSocket server to the same `http.Server` instance as Express using the `upgrade` event.
- **Why:** Simplifies deployment (single port), avoids CORS issues for WebSocket, consistent with how most Express+WS apps are structured.
- **Alternatives considered:** Separate WS port, Socket.IO (heavier, not needed), Server-Sent Events (one-way only).
- **Impact:** WS path is `/ws`. HTTP and WS share port `3001`.
- **Date:** 2026-08-21

## DEC-004 — Zod for Validation
- **Decision:** Use `zod` for request body and query parameter validation.
- **Why:** Type-safe, composable schemas, excellent TypeScript integration if ever migrated to TS backend. Better than `joi` for modern Node.js.
- **Alternatives considered:** joi, express-validator, manual validation.
- **Impact:** Validators live in `src/validators/`. Middleware `validate.js` wraps schema parsing and returns structured 422 errors.
- **Date:** 2026-08-21

## DEC-005 — Denormalized Fields in Tokens Table
- **Decision:** Store `service_name` and `staff_assigned_name` directly in the tokens row alongside the FK.
- **Why:** Display board and customer screens need token data without joins. Denormalization avoids JOIN overhead on the hot read path. Service names rarely change mid-day.
- **Alternatives considered:** Always JOIN (adds complexity to queries), materialized view (overkill for SQLite).
- **Impact:** On service rename, existing tokens retain the name at time of creation (correct audit behavior).
- **Date:** 2026-08-21

## DEC-006 — PIN Stored as bcrypt Hash
- **Decision:** Staff PIN (4 digits) is stored as a bcrypt hash, not plaintext.
- **Why:** Defense-in-depth. Even though PINs are short, a database breach would expose all PINs in plaintext otherwise. bcrypt adds negligible overhead for a 4-digit value.
- **Alternatives considered:** Plaintext (unacceptable), SHA256 (no salt, rainbow table vulnerable).
- **Impact:** bcrypt with rounds=10. `staffLogin` compares hash at login time.
- **Date:** 2026-08-21

## DEC-007 — Backend is Additive (Frontend Stays localStorage-Based)
- **Decision:** The backend is built as an independent production layer. The existing frontend localStorage/BroadcastChannel logic is NOT modified in Phase 1.
- **Why:** Zero regression risk. Teams can migrate the frontend to use the API incrementally. The backend is production-ready and can be used independently by native mobile apps or other clients.
- **Alternatives considered:** Rip-and-replace frontend API calls (high risk, out of scope).
- **Impact:** Frontend and backend can run simultaneously. API is the source of truth for multi-device deployments.
- **Date:** 2026-08-21

## DEC-008 — Rate Limiting on Public Endpoints
- **Decision:** Apply `express-rate-limit` on public mutation endpoints (token creation: 10/min/IP, display: 30/min/IP).
- **Why:** Token creation endpoint is unauthenticated. Without rate limiting, a single client could flood the queue with fake tokens.
- **Alternatives considered:** Captcha (poor UX for kiosk), no limiting (unacceptable).
- **Impact:** Legitimate users are unlikely to hit limits. Kiosk IP may need a higher limit if needed in future.
- **Date:** 2026-08-21

## DEC-009 — Token Numbers Reset Daily
- **Decision:** Token sequence numbers (e.g. A-001) restart from 001 at midnight each day.
- **Why:** Matches real-world queue counter behavior. Tokens from previous days are still in the DB (completedAt set), but new day starts fresh counters.
- **Alternatives considered:** Global sequence (confusing for staff, tickets would reach A-10000+).
- **Impact:** `tokenNumber.js` utility queries max sequence for today's tokens by prefix.
- **Date:** 2026-08-21
