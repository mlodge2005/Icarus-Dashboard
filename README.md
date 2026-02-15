# Icarus Dashboard (Public Web)

Goal: public internet dashboard to monitor Icarus (OpenClaw) status + recurring tasks + capabilities + docs.

## MVP scope (read-only)
- Tasks view (Todoist-like)
  - Manual tasks stored on VPS (JSON/SQLite)
  - Recurring tasks sourced from OpenClaw cron jobs
- Recurring tasks
  - cron list + next due + last run status
- Tools / capabilities
  - high-level tools enabled + node connectivity + browser routing
- Docs
  - render selected markdown from workspace (playbooks/, notes/, contracts/, etc.)

## Architecture
- **Frontend**: Next.js on Vercel (public)
- **Backend**: small read-only API on VPS (public HTTPS)
  - talks to local OpenClaw gateway (127.0.0.1 or tailnet) and reads workspace files
  - enforces its *own* auth (JWT/session) + read-only endpoints

## Security stance (MVP)
- No secrets exposed.
- Backend API is read-only.
- Backend requires auth; consider allowlist for Mark user only.
- Rate limit + audit logs.

## Next steps
1) Decide auth: Clerk vs Auth.js + GitHub OAuth.
2) Decide where VPS API is exposed: Caddy/Nginx + TLS.
3) Define API endpoints + data model (see api-spec.md).
