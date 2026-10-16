#!/bin/sh
set -e

# Apply pending Prisma migrations before starting the API.
# Disable by setting RUN_MIGRATIONS=false.
if [ "${RUN_MIGRATIONS:-true}" = "true" ] && [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying database migrations..."
  cd /app/packages/db
  node_modules/.bin/prisma migrate deploy
fi

cd /app/apps/api

# Seed the demo data only when the database is empty (safe, non-destructive).
# Disable by setting RUN_SEED=false.
if [ "${RUN_SEED:-true}" = "true" ] && [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Checking seed state..."
  node seed-if-empty.js
fi

echo "[entrypoint] Starting API..."
exec node index.js
