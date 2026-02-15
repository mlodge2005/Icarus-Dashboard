# API Spec (draft) — Icarus Dashboard

Base: `https://<your-domain>/api` (served from VPS)

All endpoints read-only. Auth required.

## Auth
- `POST /auth/login` (optional if using OAuth session cookies)
- Prefer OAuth on frontend + signed JWT to backend.

## Core
### GET /health
Returns backend version + ok.

### GET /openclaw/status
Subset of `openclaw status --json` (or parsed status) without secrets.

### GET /openclaw/cron/jobs
List cron jobs: id, name, schedule, enabled.

### GET /openclaw/cron/jobs/:id/runs
Recent runs: timestamps, ok/fail, summary.

### GET /capabilities
- tools enabled
- node connectivity summary
- browser routing (mode/node)

## Tasks (Todoist-like)
Stored on VPS (not Todoist).

### GET /tasks
### GET /tasks/:id

Future (not MVP): POST/PATCH/DELETE.

## Docs
### GET /docs/index
List allowed markdown docs.

### GET /docs/:slug
Renders markdown (server-side) or returns raw markdown.

## Notes
- Backend should talk to OpenClaw locally; avoid exposing OpenClaw gateway token to Vercel.
- Prefer a dedicated backend token and short-lived sessions.
