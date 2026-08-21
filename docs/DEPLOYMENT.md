# DEPLOYMENT.md — Deployment Guide

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Runtime environment | `production` / `development` |
| `PORT` | No | HTTP server port | `3001` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | `your-random-32-char-secret-here` |
| `JWT_EXPIRES_IN` | No | JWT TTL | `8h` |
| `DB_PATH` | No | SQLite file path | `./data/queuedigially.db` |
| `ALLOWED_ORIGINS` | No | CORS origins (comma-separated) | `https://yourdomain.com` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `60000` |
| `LOG_LEVEL` | No | Log verbosity | `info` / `debug` |
| `GEMINI_API_KEY` | No | For AI features (future) | — |
| `APP_URL` | No | Public app URL | `https://yourapp.com` |

---

## Development Setup

```bash
# From project root
cd backend
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET

npm run dev   # Starts backend with nodemon on port 3001
```

Frontend dev server (separate terminal):
```bash
# From project root
cd frontend
npm install
npm run dev   # Vite on port 3000, proxied to backend :3001
```

---

## Production Build & Start

```bash
cd backend
npm install --production
npm start    # node src/server.js
```

Build the frontend separately:
```bash
cd frontend
npm install
npm run build
```

Or with PM2:
```bash
pm2 start src/server.js --name queuedigially-api
pm2 save
```

---

## Database

- SQLite file is created automatically at `backend/data/queuedigially.db` on first run
- Schema migration runs automatically on startup
- Initial seed (admin user + demo data) runs if DB is empty
- **Backup:** Copy the `.db` file. That's it.
- **`backend/data/`** is in `.gitignore`

---

## Build Architecture

```
Internet → Reverse Proxy (nginx/caddy)
             ├── /          → Static React build (dist/)
             └── /api/v1/   → Node.js backend :3001
             └── /ws        → WebSocket upgrade :3001
```

Sample nginx location block:
```nginx
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Health Check

`GET /api/v1/health` returns:
```json
{ "status": "ok", "timestamp": "2026-08-21T10:00:00Z", "uptime": 3600 }
```
Use this for load balancer / container health probes.

---

## Logging

- HTTP request logs: `morgan` → stdout in `combined` format (production) or `dev` (development)
- Application logs: structured `console.log` with timestamp, level, message
- Logs never contain: passwords, PINs, JWT secrets, or tokens

---

## Security Checklist Before Production

- [ ] `JWT_SECRET` is a random 32+ char string (not the default)
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` set to actual frontend domain
- [ ] Admin default password changed from `admin123`
- [ ] `backend/data/` directory is writable
- [ ] HTTPS enabled on reverse proxy
- [ ] Database file backed up regularly
- [ ] `.env` file not committed to git
