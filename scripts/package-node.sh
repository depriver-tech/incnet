#!/usr/bin/env bash
# Builds dist/incnet-node.zip: incnet ready to upload to any host with Node.js 20+
# (cPanel "Setup Node.js App", Plesk, Hostinger, DirectAdmin, or a plain `node app.js`).
#
#   bash scripts/package-node.sh
#
# The zip holds the built server, its static files, a start file (app.js) that creates the
# database tables on first start, and a .env.example to fill in.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "incnet: installing and building..."
[ -d node_modules ] || npm ci --no-audit --no-fund
npx prisma generate >/dev/null
npx next build >/dev/null

OUT=dist/incnet-node
rm -rf dist && mkdir -p "$OUT/.next"
cp -R .next/standalone/. "$OUT/"
cp -R .next/static "$OUT/.next/static"
cp -R public "$OUT/public"
rm -f "$OUT/.env" "$OUT/.env.local"
cp scripts/shared-hosting/app.js "$OUT/app.js"
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script 2>/dev/null > "$OUT/schema.sql"
cat > "$OUT/.env.example" <<'ENV'
# Copy to .env (or enter these in your host's Node.js app settings).
DATABASE_URL=postgresql://user:password@host:5432/dbname
APP_URL=https://wifi.example.com
APP_SECRET=put-a-long-random-string-here-at-least-32-characters
# Optional
# DATABASE_SCHEMA=incnet
# ALLOW_SIGNUP=false
# ROUTER_SYNC_SECONDS=8
ENV
cat > "$OUT/README.txt" <<'TXT'
incnet for shared hosting
=========================
1. Create a PostgreSQL database (most shared hosts only offer MySQL: use a free one from Supabase or Neon).
2. Upload everything in this folder to your hosting account, e.g. ~/incnet.
3. In your control panel open "Setup Node.js App" (or Node.js), create an app:
     Node version 20 or newer · Application root: incnet · Startup file: app.js
4. Add the variables from .env.example (DATABASE_URL, APP_URL, APP_SECRET), or upload a filled-in .env.
5. Start or restart the app, then open your domain and create the first account.
The tables are created automatically on the first start. Full guide: docs/self-hosting.md
TXT

(cd dist && zip -qr incnet-node.zip incnet-node)
echo "incnet: built dist/incnet-node.zip ($(du -h dist/incnet-node.zip | cut -f1))"
