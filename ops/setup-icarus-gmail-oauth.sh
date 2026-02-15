#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/admin/.openclaw/workspace/projects/icarus-dashboard/integrations"
ENV_FILE="$ROOT/.env"

echo "== Icarus Gmail OAuth setup =="
echo "This script will create $ENV_FILE and start the integrations server locally."
echo

echo "Google Cloud prerequisites (do these first):"
echo "- Enable Gmail API"
echo "- Create OAuth client (Web application)"
echo "- Authorized redirect URI: https://api.dashboard.studio-khan.com/oauth/google/callback"
echo

read -r -p "Google OAuth Client ID: " GOOGLE_CLIENT_ID
read -r -s -p "Google OAuth Client Secret: " GOOGLE_CLIENT_SECRET
echo

INTEG_API_KEY="$(openssl rand -hex 32)"

echo "Writing .env (no secrets printed)..."
cat > "$ENV_FILE" <<EOF
INTEG_BIND_HOST=127.0.0.1
INTEG_BIND_PORT=8789
INTEG_PUBLIC_BASE_URL=https://api.dashboard.studio-khan.com
INTEG_API_KEY=$INTEG_API_KEY
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GMAIL_ACCOUNT=icarusclawdbot@gmail.com
GMAIL_ALLOW_SEND_NO_APPROVAL_TO=mlodge2005@gmail.com
EOF
chmod 600 "$ENV_FILE"

echo
echo "Install deps + start server:"
cd "$ROOT"
npm install

echo
echo "Starting server on http://127.0.0.1:8789"
echo "Next: open this URL in your browser to connect Gmail:"
echo "  https://api.dashboard.studio-khan.com/oauth/google/start"
echo
echo "Your integrations API key (store this somewhere safe):"
echo "$INTEG_API_KEY"
echo
echo "Run server (foreground): npm start"
echo "Or set up systemd/Caddy next (recommended)."
