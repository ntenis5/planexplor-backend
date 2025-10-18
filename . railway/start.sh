#!/bin/bash
set -e

cp -r src/services/ dist/services/ 2>/dev/null || true

export NODE_ENV=production
export PORT=$PORT

exec npx ts-node --esm src/app.ts
