FROM node:20-alpine

WORKDIR /app

# Kopjo package files së pari për cache optimizim
COPY package*.json ./
COPY tsconfig*.json ./

# INSTALO PA GABIME SINTAKSË
RUN npm ci --prefer-offline --no-audit

# Kopjo kodin dhe build
COPY . .
RUN npm run build

# Cleanup development dependencies
RUN npm prune --production

# Performance flags
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start me performance optimizations
CMD ["node", "--max-old-space-size=4096", "dist/app.js"]
