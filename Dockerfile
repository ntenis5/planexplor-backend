FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

# Cache layers for faster builds
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs

COPY --from=builder --chown=nodeapp:nodejs /app/package.json ./
COPY --from=builder --chown=nodeapp:nodejs /app/dist ./dist

RUN npm ci --prefer-offline --no-audit --production && npm cache clean --force

USER nodeapp

# Performance optimized Node.js flags
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Ultra performance start
CMD ["node", "--max-old-space-size=8192", "--v8-pool-size=8", "--max-semi-space-size=512", "dist/app.js"]
