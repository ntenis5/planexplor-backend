FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build

RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--max-old-space-size=4096", "dist/app.js"]
