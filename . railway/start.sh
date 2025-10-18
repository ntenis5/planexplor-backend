#!/bin/bash
set -e

export NODE_ENV=production
export PORT=$PORT

exec npx ts-node --esm src/app.ts
