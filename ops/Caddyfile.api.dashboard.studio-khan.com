# Caddy reverse proxy for Icarus Integrations
# Domain: api.dashboard.studio-khan.com

api.dashboard.studio-khan.com {
  encode gzip

  # OAuth + Gmail bridge
  reverse_proxy /health 127.0.0.1:8789
  reverse_proxy /oauth/* 127.0.0.1:8789
  reverse_proxy /gmail/* 127.0.0.1:8789

  # (Optional) if you later expose dashboard API on 3040:
  # reverse_proxy /dash/* 127.0.0.1:3040

  log {
    output file /var/log/caddy/icarus-api-access.log
  }
}
