#!/bin/sh
set -e

PRISMA_BIN=$(find /app/node_modules/.pnpm -path '*/node_modules/prisma/build/index.js' 2>/dev/null | head -1)

if [ -z "$PRISMA_BIN" ]; then
  echo "prisma CLI not found under /app/node_modules/.pnpm" >&2
  exit 1
fi

node "$PRISMA_BIN" db push --skip-generate --schema /app/apps/api/prisma/schema.prisma
exec node /app/apps/api/dist/index.js
