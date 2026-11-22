#!/usr/bin/env bash
# incnet server installer, for a Raspberry Pi (64-bit OS) or any Linux VPS.
#
#   curl -fsSL https://raw.githubusercontent.com/depriver-tech/incnet/main/scripts/install.sh | sudo DOMAIN=wifi.example.com bash
#
# Installs Docker if needed, downloads incnet to /opt/incnet, writes a .env with fresh secrets,
# and starts incnet + Postgres + Caddy (automatic HTTPS from Let's Encrypt). Safe to run again: it updates.
set -euo pipefail

DIR="${INCNET_DIR:-/opt/incnet}"
REPO="${INCNET_REPO:-https://github.com/depriver-tech/incnet.git}"
say() { printf '\033[1;36mincnet:\033[0m %s\n' "$1"; }
die() { printf '\033[1;31mincnet:\033[0m %s\n' "$1" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "Run as root, for example: curl ... | sudo DOMAIN=wifi.example.com bash"

DOMAIN="${DOMAIN:-}"
if [ -z "$DOMAIN" ] && [ -f "$DIR/.env" ]; then DOMAIN="$(sed -n 's/^DOMAIN=//p' "$DIR/.env")"; fi
if [ -z "$DOMAIN" ] && [ -r /dev/tty ]; then
  read -rp "Domain for incnet (its DNS must point to this machine), e.g. wifi.example.com: " DOMAIN </dev/tty
fi
[ -n "$DOMAIN" ] || die "Set DOMAIN, for example: sudo DOMAIN=wifi.example.com bash"

if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker..."
  curl -fsSL https://get.docker.com | sh >/dev/null
fi
command -v git >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq git >/dev/null; }

if [ -d "$DIR/.git" ]; then
  say "Updating incnet in $DIR..."
  git -C "$DIR" pull -q --ff-only
else
  say "Downloading incnet to $DIR..."
  git clone -q --depth 1 "$REPO" "$DIR"
fi
cd "$DIR"

if [ ! -f .env ]; then
  say "Writing .env with new secrets..."
  cat > .env <<ENV
DOMAIN=$DOMAIN
APP_URL=https://$DOMAIN
APP_SECRET=$(openssl rand -base64 48 | tr -d '\n')
POSTGRES_PASSWORD=$(openssl rand -hex 24)
ALLOW_SIGNUP=false
INCNET_CLOUD=false
TZ=Africa/Dar_es_Salaam
ENV
  chmod 600 .env
fi

say "Building and starting (the first build takes a few minutes, longer on a Pi)..."
docker compose --profile https up -d --build

say "Done. Open https://$DOMAIN and create the first account. It becomes the owner."
say "Logs: cd $DIR && docker compose logs -f app"
