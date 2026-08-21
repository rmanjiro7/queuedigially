# QueueDigially — Backend API

Production REST API + WebSocket backend for the QueueDigially queue management system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v22+ |
| Framework | Express 4 |
| Database | SQLite via `node:sqlite` (built-in, no compilation required) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | Zod |
| Real-time | WebSocket (`ws`) |

## Requirements

- Node.js **v22 or later** (uses built-in `node:sqlite`)
- No database installation needed (SQLite file created automatically)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set a strong JWT_SECRET
```

## Environment Variables

See `.env.example` for all variables. Required:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for JWT signing — use a random 32+ char string |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: `3001`) |

## Running

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3001` by default.

## First Run

On first start, the database is automatically:
1. Created at `backend/data/queuedigially.db`
2. Schema migrated
3. Seeded with demo data

**Default admin credentials:**
- Email: `admin@queueflow.com`
- Password: `admin123`

**Default staff PIN:** `1234` (for all seeded staff)

> Change these in production via the admin portal.

## API

Base URL: `http://localhost:3001/api/v1`

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | Public | Health check |
| `POST /auth/admin/login` | Public | Admin login → JWT |
| `POST /auth/staff/login` | Public | Staff login → JWT |
| `GET /auth/me` | JWT | Current user profile |
| `GET /services` | Public | List services |
| `GET /settings` | Public | Org settings |
| `GET /display` | Public | Display board data |
| `GET /tokens/:tokenNumber` | Public | Look up a token |
| `POST /tokens` | Public | Create a queue token |
| `PATCH /tokens/:id/delay` | Public | Request delay buffer |
| `GET /tokens` | Staff | List tokens with filters |
| `POST /tokens/call-next` | Staff | Call next eligible token |
| `PATCH /tokens/:id/status` | Staff | Update token status |
| `POST /tokens/:id/recall` | Staff | Recall a skipped token |
| `GET /stats` | Admin/Supervisor | Queue KPIs |
| `GET /audit-logs` | Admin | Audit event log |
| `GET /staff` | Admin/Supervisor | Staff list |
| `POST /staff` | Admin | Add staff member |
| `PUT /staff/:id` | Admin | Update staff member |
| `DELETE /staff/:id` | Admin | Remove staff member |
| `POST /services` | Admin | Create service |
| `PUT /services/:id` | Admin | Update service |
| `DELETE /services/:id` | Admin | Delete service |
| `PUT /settings` | Admin | Update settings |
| `POST /admin/reset-demo` | Admin | Reset to demo data |

Full contract: see [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)

## WebSocket

Connect to `ws://localhost:3001` — no path needed.

The server broadcasts JSON events on every state change:
```json
{ "event": "TOKEN_CALLED", "data": { ...token }, "timestamp": 1234567890 }
```

Events: `TOKEN_CREATED`, `TOKEN_CALLED`, `TOKEN_SERVING`, `TOKEN_COMPLETED`, `TOKEN_SKIPPED`, `TOKEN_RECALLED`, `TOKEN_CANCELLED`, `TOKEN_DELAYED`, `SERVICE_UPDATED`, `STAFF_UPDATED`, `SETTINGS_UPDATED`

## Project Structure

```
src/
├── config/        # DB, env, logger
├── routes/        # HTTP route definitions
├── controllers/   # Request/response handling
├── services/      # Business logic
├── repositories/  # Database queries
├── middlewares/   # Auth, validation, error handling, rate limiting
├── validators/    # Zod schemas
├── utils/         # Token numbering, wait time, seed, responses
├── constants/     # Enums, transition rules, WS event names
├── websocket/     # WS server + broadcast
├── app.js         # Express app setup
└── server.js      # Entry point
```

## Documentation

Full project documentation is in [`../docs/`](../docs/):

- `CONTEXT.md` — Project overview and stack
- `REQUIREMENTS.md` — Numbered backend requirements
- `ARCHITECTURE.md` — System diagram and data flows
- `API_CONTRACT.md` — Full API specification
- `DATABASE.md` — Schema and relationships
- `BUSINESS_RULES.md` — Enforced business logic
- `SECURITY.md` — Auth, authorization, security checklist
- `DECISIONS.md` — Architecture decision log
- `DEPLOYMENT.md` — Production deployment guide
