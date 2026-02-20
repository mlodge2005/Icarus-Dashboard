# OpenClaw Prompt Log Hook Setup

## Goal
Automatically append prompt/response summaries to Icarus Hub Prompt Log via HTTP hook.

## Endpoint
`POST https://<your-dashboard-domain>/api/prompt-log-hook`

## Auth
Header:
`Authorization: Bearer <PROMPT_LOG_HOOK_SECRET>`

## Required env in Vercel
- `PROMPT_LOG_HOOK_SECRET` (new strong secret)
- `NEXT_PUBLIC_CONVEX_URL` (already present)

## Payload
```json
{
  "promptSummary": "User asked to run release protocol",
  "actionSummary": "Queued run, validated inputs, started execution",
  "source": "openclaw:webchat",
  "now": "2026-02-20T01:45:00.000Z"
}
```

## OpenClaw integration idea
On inbound message + on assistant completion, POST one event each to this endpoint.
- inbound event: summarize user prompt
- outbound event: summarize assistant action

If your OpenClaw runtime supports webhooks/hooks in config, wire both events to this endpoint with bearer auth.
