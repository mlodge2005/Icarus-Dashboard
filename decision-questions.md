# Decisions needed (MVP)

1) Domain / DNS
- What domain should host the dashboard? (e.g., dashboard.<domain>)
- Who manages DNS?

2) VPS public HTTPS
- Use Caddy (recommended) or Nginx?
- Any existing reverse proxy in front of the gateway?

3) Auth
- GitHub OAuth (single user) via Auth.js, or Clerk?
- Should login be restricted to a single GitHub account id?

4) Data exposure
- Which workspace paths are allowed in /docs?
- Should we show raw OpenClaw config? (recommended: no)

5) Update cadence
- Polling interval for status/cron (e.g., 10s/30s/60s)
