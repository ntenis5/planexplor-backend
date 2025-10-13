#!/bin/bash
# Railway Start Script - Robust Version

set -e  # Exit on any error

echo "🚀 Starting Planexplor Backend..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found. Building..."
  npm run build
fi

# Check if app.js exists
if [ ! -f "dist/app.js" ]; then
  echo "❌ dist/app.js not found. Building..."
  npm run build
fi

# Set production environment
export NODE_ENV=production
export PORT=$PORT

echo "✅ Starting application on port $PORT..."
exec node dist/app.js
