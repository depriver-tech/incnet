#!/usr/bin/env bash
# Vercel build: generate the client, create or update tables when a database is connected, build.
# `prisma db push` refuses changes that would lose data, so a risky schema change fails the build instead.
set -euo pipefail
npx prisma generate
if [ -n "${DATABASE_URL:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-}}}" ]; then npx prisma db push; else echo "incnet: no database connected yet; skipping table setup"; fi
npx next build
