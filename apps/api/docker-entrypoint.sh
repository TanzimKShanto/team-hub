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
echo "[entrypoint] Starting API..."
exec node index.js
