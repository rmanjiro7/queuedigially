# TESTING.md — Testing Strategy

---

## Framework
- **Test runner:** `jest` with `supertest` for HTTP integration tests
- **Location:** `backend/tests/`
- **Run:** `npm test` (from `backend/` directory)

---

## Test Categories

### Unit Tests (`tests/unit/`)
Test isolated service and utility functions without DB or HTTP.

Priority targets:
- `tokenNumber.js` — sequence generation, daily reset, zero-padding
- `waitTime.js` — VIP multiplier, queue position calculation
- `auth.service.js` — bcrypt comparison logic
- `queue.service.js` — priority sort, eligibility filter, transition validation

### Integration Tests (`tests/integration/`)
Test full request → response cycle using an in-memory SQLite DB.

Priority targets:
- **Auth:** Admin login success/failure, staff login success/failure, JWT verification
- **Token creation:** valid, inactive service, capacity exceeded, rate limit
- **Token lifecycle:** full flow (create → call → serve → complete), invalid transitions
- **Staff actions:** call-next with service filter, skip, recall
- **Admin CRUD:** services, staff, settings
- **Authorization:** staff endpoints reject unauthenticated, admin endpoints reject staff role

### Fixtures (`tests/fixtures/`)
- `seedTestDb.js` — inserts minimal seed data before integration tests
- `tokenFixtures.js` — reusable token factory functions

---

## Critical Test Cases

| Test | Why Critical |
|------|-------------|
| Admin login with wrong password returns 401 | Auth security |
| Staff login with wrong PIN returns 401 | Auth security |
| Expired JWT returns 401 | Auth security |
| Staff role cannot access admin endpoints → 403 | Authorization |
| Token cannot be created for inactive service → 409 | BR-001 |
| Token status: waiting → completed directly → 409 | BR-008 |
| Token status: completed → cancelled → 409 | BR-008 |
| Duplicate service prefix → 409 | BR-017 |
| Delete service with active tokens → 409 | BR-018 |
| Exceed maxQueueSize → 409 | BR-011 |
| PIN never returned in staff response | Security |
| Password hash never returned in admin response | Security |
| Stack trace not in production error response | Security |

---

## Test Database
Tests use a separate in-memory SQLite instance seeded fresh before each test suite. Never touch the real `queuedigially.db`.

---

## Coverage Target
- Services: 80%+
- Controllers: 70%+
- Repositories: 60%+
- Middlewares: 90%+
