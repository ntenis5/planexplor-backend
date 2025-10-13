#!/bin/bash
# Railway Start Script - Performance Optimized

export NODE_ENV=production
export UV_THREADPOOL_SIZE=128

# Performance optimizations for Node.js
exec node \
  --max-old-space-size=4096 \
  --max-semi-space-size=128 \
  --v8-pool-size=4 \
  --optimize-for-size \
  --memory-reducer \
  dist/app.js
