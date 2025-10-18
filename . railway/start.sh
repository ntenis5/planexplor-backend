#!/bin/bash
set -e

export NODE_ENV=production
export PORT=$PORT

if ! command -v ts-node &> /dev/null; then
    echo "Installing ts-node..."
    npm install -g ts-node
fi

exec npx ts-node src/app.ts
