# REQUIREMENTS.md — Backend Requirements

Derived from frontend source code, data structures, and business logic in QueueContext.tsx.

---

## REQ-001 — Admin Authentication
- **Description:** Admin can log in with email and password and receive a JWT.
- **Source:** AdminLogin.tsx, QueueContext.adminLogin()
- **Priority:** High
- **Backend impact:** `POST /api/v1/auth/admin/login`, AdminUser model, bcrypt password hash
- **Status:** Pending

## REQ-002 — Staff Authentication
- **Description:** Staff member selects their profile, enters a 4-digit PIN, and optionally selects a counter. Receives a JWT.
- **Source:** StaffLogin.tsx, QueueContext.staffLogin()
- **Priority:** High
- **Backend impact:** `POST /api/v1/auth/staff/login`, Staff model with hashed PIN
- **Status:** Pending

## REQ-003 — Token Lifecycle Management
- **Description:** Full queue token lifecycle: create (waiting) → called → serving → completed | skipped | cancelled. Includes request delay (+5 min buffer).
- **Source:** QueueContext (createToken, callNextToken, startServingToken, markTokenServed, skipToken, recallToken, cancelToken, requestDelay)
- **Priority:** High
- **Backend impact:** Token model, queue service, all token endpoints
- **Status:** Pending

## REQ-004 — Service Department CRUD
- **Description:** Admin can create, read, update, delete service departments. Each has a prefix, average duration, capacity, icon, and active flag.
- **Source:** AdminPortal.tsx (services tab), QueueContext (addService, updateService, deleteService)
- **Priority:** High
- **Backend impact:** `GET|POST /api/v1/services`, `PUT|DELETE /api/v1/services/:id`
- **Status:** Pending

## REQ-005 — Staff Roster CRUD
- **Description:** Admin can add and update staff members. Each staff has a role, counter assignment, and service assignment list.
- **Source:** AdminPortal.tsx (staff tab), QueueContext (addStaff, updateStaff)
- **Priority:** High
- **Backend impact:** `GET|POST /api/v1/staff`, `PUT /api/v1/staff/:id`
- **Status:** Pending

## REQ-006 — Organization Settings
- **Description:** Admin can update org name, venue name, operating hours, sound/speech toggles, max queue size, VIP multiplier, and theme.
- **Source:** AdminPortal.tsx (settings tab), QueueContext.updateSettings()
- **Priority:** Medium
- **Backend impact:** `GET|PUT /api/v1/settings`
- **Status:** Pending

## REQ-007 — Audit Log (Read-Only)
- **Description:** Every queue action is recorded as an audit log entry. Admin can read the log. Log is append-only; max 50 entries returned per request by default.
- **Source:** QueueContext.addLog(), AdminPortal.tsx (audit feed)
- **Priority:** Medium
- **Backend impact:** `GET /api/v1/audit-logs`, AuditLog model (insert only, no update/delete)
- **Status:** Pending

## REQ-008 — Real-time WebSocket Broadcasts
- **Description:** When token state changes (called, serving, completed, etc.), all connected clients receive a WebSocket event so the display board, staff terminals, and customer screens update live.
- **Source:** QueueContext BroadcastChannel logic (to be upgraded to server-side WS)
- **Priority:** High
- **Backend impact:** WebSocket server, broadcast on every mutation
- **Status:** Pending

## REQ-009 — Queue Statistics / KPIs
- **Description:** Admin overview needs counts: total today, waiting, serving, completed, avg wait time.
- **Source:** AdminPortal.tsx (KPI bento grid)
- **Priority:** Medium
- **Backend impact:** `GET /api/v1/stats` (admin only)
- **Status:** Pending

## REQ-010 — Password Reset (Email Stub)
- **Description:** Admin can trigger a password reset by email. Backend logs the request (no real email in v1).
- **Source:** AdminLogin.tsx forgot password modal
- **Priority:** Low
- **Backend impact:** `POST /api/v1/auth/admin/forgot-password` (stub, logs only)
- **Status:** Pending
- **Note:** ASSUMPTION — real email delivery deferred to v2.

## REQ-011 — Display Board Public Read
- **Description:** The lobby TV display board needs live queue data without authentication (it's a kiosk screen).
- **Source:** DisplayBoard.tsx
- **Priority:** High
- **Backend impact:** `GET /api/v1/display` (public, rate-limited)
- **Status:** Pending

## REQ-012 — Customer / Kiosk Token Creation (Public)
- **Description:** Customers can create a queue token without logging in. Kiosk does the same.
- **Source:** CustomerView.tsx, KioskMode.tsx
- **Priority:** High
- **Backend impact:** `POST /api/v1/tokens` (public endpoint with rate limiting)
- **Status:** Pending

## REQ-013 — Token Lookup by Number (Public)
- **Description:** Customer can search for their token by token number (e.g. "A-042") and retrieve its live status.
- **Source:** CustomerView.tsx handleSearchTicket()
- **Priority:** Medium
- **Backend impact:** `GET /api/v1/tokens/:tokenNumber` (public)
- **Status:** Pending

## REQ-014 — Data Seed / Reset
- **Description:** Admin can reset to demo seed data (for demos and testing).
- **Source:** QueueContext.resetDemoData()
- **Priority:** Low
- **Backend impact:** `POST /api/v1/admin/reset-demo` (admin only)
- **Status:** Pending

## REQ-015 — Health Check
- **Description:** Deployment health probe endpoint.
- **Source:** ASSUMPTION — standard production requirement.
- **Priority:** High
- **Backend impact:** `GET /api/v1/health`
- **Status:** Pending
