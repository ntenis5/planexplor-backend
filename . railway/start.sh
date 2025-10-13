#!/bin/bash
set -e

if [ ! -d "dist" ]; then
    npm run build
fi

if [ ! -f "dist/app.js" ]; then
    npm run build
fi

export NODE_ENV=production
export PORT=$PORT

exec node dist/app.js
