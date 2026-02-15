# Plan — dashboard.studio-khan.com (Vercel) + api.dashboard.studio-khan.com (VPS)

## DNS
- `dashboard.studio-khan.com` -> Vercel
- `api.dashboard.studio-khan.com` -> VPS public IP (187.77.193.84)

## Frontend (Vercel)
- Next.js app
- Auth.js GitHub OAuth
- Restrict to Mark's GitHub user id
- UI pages: Overview, Recurring (cron), Tasks, Docs, Capabilities

## Backend API (VPS)
- Small Node service (Fastify or Express) bound to localhost (127.0.0.1:3040)
- Served publicly via Caddy at `api.dashboard.studio-khan.com`
- Auth: verify JWT signed by frontend (or shared secret) + strict allowlist
- Read-only routes:
  - /health
  - /openclaw/status (sanitized)
  - /openclaw/cron/jobs
  - /openclaw/cron/jobs/:id/runs
  - /docs/index + /docs/:slug (allowlisted file roots)
  - /capabilities
  - /tasks (stored on VPS)

## Security
- Never proxy raw gateway token.
- Backend talks to OpenClaw locally.
- Rate limiting + audit logs.

## Next actions
1) Scaffold frontend repo + backend service in workspace.
2) Install Caddy and configure site for api subdomain.
3) Provide deployment steps for GitHub + Vercel connection (Mark performs OAuth clicks).
