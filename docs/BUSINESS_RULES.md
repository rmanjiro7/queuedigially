# BUSINESS_RULES.md — Business Logic Rules

These rules MUST be enforced on the backend. Frontend validation is cosmetic only.

---

## Token Rules

**BR-001** — A token can only be created for an active service (`isActive = true`).

**BR-002** — A token can only be created if the service has not reached `maxDailyCapacity` for today. If `maxDailyCapacity` is null/0, no cap is enforced.

**BR-003** — Token numbers are sequential per prefix per calendar day (midnight reset). Format: `{PREFIX}-{NNN}` where NNN is zero-padded to 3 digits. E.g. `A-001`.

**BR-004** — Priority ordering for the waiting queue: VIP → Priority → Normal. Within the same priority tier, FIFO by `joined_at` timestamp.

**BR-005** — VIP estimated wait time is multiplied by `0.4` relative to normal calculation (faster due to priority).

**BR-006** — A staff member can only call tokens for services in their `assignedServiceIds`. Exception: if `assignedServiceIds` is empty, they can call any service.

**BR-007** — Only one token can be in `serving` or `called` status per counter at any time. A staff member must complete or skip the current token before calling the next.

**BR-008** — Valid token status transitions:
```
waiting   → called     (via call-next or direct call)
waiting   → cancelled  (customer self-cancels)
called    → serving    (customer arrived at counter)
called    → skipped    (no-show)
serving   → completed  (service done)
serving   → skipped    (edge case: staff marks no-show after arrival)
skipped   → called     (recall — customer came back)
```
Any other transition must be rejected with 409 Conflict.

**BR-009** — A customer can only request a delay (`+extraMinutes`) if their token is in `waiting` or `called` status.

**BR-010** — Cancellation is only allowed while token is in `waiting`, `called`, or `serving`. Completed or already-cancelled tokens cannot be cancelled again.

---

## Queue Capacity Rules

**BR-011** — The global `maxQueueSize` setting caps the total number of active tokens (waiting + called + serving) across all services. Attempting to create a token when at capacity returns 409.

**BR-012** — If a service is set to `isActive = false`, new tokens cannot be created for it, but existing tokens continue their lifecycle normally.

---

## Staff Rules

**BR-013** — Staff PIN must be exactly 4 characters (numeric). Default PIN for new staff is `1234`.

**BR-014** — A staff member's `servedTodayCount` increments by 1 each time a token is marked `completed` by that staff member.

**BR-015** — Only an admin can change a staff member's `role` or `assignedServiceIds`.

**BR-016** — A staff member cannot delete themselves via the API.

---

## Service Rules

**BR-017** — Service `prefix` must be 1–2 uppercase letters. Prefix must be unique across all services.

**BR-018** — A service cannot be deleted if it has tokens in `waiting`, `called`, or `serving` status.

**BR-019** — Deactivating a service (`isActive = false`) is allowed even if tokens exist for it.

---

## Admin Rules

**BR-020** — The first admin account is seeded on DB initialization. Email: `admin@queueflow.com`, password: `admin123` (must be changed in production).

**BR-021** — Only admin-role users can access: service CRUD, staff CRUD, settings update, audit logs, stats, demo reset.

---

## Audit Log Rules

**BR-022** — Every state-changing operation must produce an audit log entry. The log is append-only; no update or delete on audit_logs table.

**BR-023** — Audit log is capped at 1000 rows. On insert, if count > 1000, the oldest 100 rows are purged.

---

## Display Board Rules

**BR-024** — The display board endpoint is public and does NOT require authentication.

**BR-025** — Display board returns at most 10 `nowServing` tokens and 5 `upNext` tokens to keep the TV screen readable.
