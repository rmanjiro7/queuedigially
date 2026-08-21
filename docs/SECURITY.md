# SECURITY.md — Security Specification

---

## Authentication

- Admin login: email + password → bcrypt comparison → JWT issued
- Staff login: staffId + PIN → bcrypt comparison → JWT issued
- JWT payload: `{ sub: id, role, name|email, iat, exp }`
- JWT secret: `process.env.JWT_SECRET` (minimum 32 chars, randomly generated)
- Token TTL: `8h` for both admin and staff
- Tokens transmitted via `Authorization: Bearer <token>` header only
- No JWT in cookies, no JWT in query strings

## Authorization

| Endpoint Category | Required |
|-------------------|----------|
| Public (token create, display, services read, health) | None |
| Staff actions (call, serve, skip, recall, complete) | JWT (role: any) |
| Admin actions (CRUD services/staff/settings, audit logs, stats) | JWT (role: admin or supervisor where noted) |

- `authMiddleware` verifies JWT signature and expiry on every protected route
- `requireRole(...roles)` middleware checks `req.user.role` against allowed roles
- Object-level: staff can only update their own `isOnline` status (not other staff records)
- Staff ID is always taken from `req.user.sub` (JWT), never from request body for mutations

## Password / PIN Security

- Admin passwords: bcrypt with `saltRounds = 12`
- Staff PINs: bcrypt with `saltRounds = 10`
- Passwords/PINs NEVER returned in any API response
- Passwords/PINs NEVER logged
- No plaintext storage anywhere

## Input Validation

- All request bodies validated with Zod schemas before reaching controllers
- Strict schema: unknown keys are stripped (`z.object().strict()` where appropriate)
- String lengths capped: name ≤ 100, description ≤ 500, notes ≤ 500
- Enum fields validated against known values
- SQL injection: not possible — all DB access uses `better-sqlite3` prepared statements with parameterized queries

## HTTP Security Headers

Applied via `helmet`:
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS in prod)
- `X-XSS-Protection`
- `Referrer-Policy`

## CORS

- `cors` package with explicit `origin` whitelist
- Development: `http://localhost:3000` (Vite dev server)
- Production: set via `ALLOWED_ORIGINS` env var (comma-separated list)
- Methods: `GET, POST, PUT, PATCH, DELETE`
- `credentials: true` to allow Authorization header

## Rate Limiting

- `express-rate-limit` applied globally (100 req/15min per IP)
- Stricter limits on:
  - `POST /api/v1/tokens`: 10 req/min per IP (prevent queue flooding)
  - `POST /api/v1/auth/*`: 5 req/min per IP (prevent brute force)
  - `GET /api/v1/display`: 30 req/min per IP

## Sensitive Data

Never expose in responses:
- `password_hash`, `pin_hash`
- `JWT_SECRET`
- Database credentials or file path
- Stack traces in production (`NODE_ENV=production` suppresses them)

## Environment Secrets

- All secrets in `.env` file
- `.env` in `.gitignore`
- `.env.example` provided with placeholder values
- Required vars validated on startup via `src/config/env.js` (throws if missing)

## Error Information Leakage

- In production: generic error messages only, no stack traces in responses
- In development: full error details returned for debugging
- Controlled by `NODE_ENV` environment variable

## Injection Prevention

- All SQL uses parameterized queries (better-sqlite3 prepared statements)
- No `eval()`, no `Function()`, no dynamic `require()`
- Input sanitization via Zod (type coercion + length limits)

## File Upload Security

- No file uploads in v1

## Audit Trail

- All authentication events logged to audit_logs
- All token state changes logged
- All admin mutations logged
- Failed login attempts logged (without exposing the attempted password)
