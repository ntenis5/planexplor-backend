# ----------------------------------------------------
# FAZA 1: BUILD STAGE (Kompajllimi i TypeScript)
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Instalo varësitë e ndërtimit (dev + prod)
# Zgjidhja për gabimin: Përdorim * wildcard për të kapur package-lock.json, yarn.lock, etj.
COPY package.json ./
# Kjo COPY duhet të kapë ose package-lock.json ose yarn.lock, nëse ekziston.
# Nëse ende nuk funksionon, sigurohu që ta kesh 'package-lock.json' në root.
COPY package-lock.json* ./ 
COPY yarn.lock* ./

# Instalimi i varësive (përdorim 'npm ci' për siguri dhe saktësi)
RUN npm ci

# 2. Kopjo kodin burimor dhe kompajlloje
COPY . .
RUN npm run build 

# ----------------------------------------------------
# FAZA 2: PRODUCTION STAGE (Imazhi Final Minimalist)
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 3. Kopjo vetëm package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./ 
COPY --from=builder /app/yarn.lock* ./

# 4. Instalo vetëm varësitë e prodhimit
RUN npm ci --production --silent

# 5. Kopjo kodin e kompajlluar (JS)
COPY --from=builder /app/dist ./dist

# Përdoruesi jo-root
# USER nodejs 

EXPOSE 8080

CMD ["node", "dist/app.js"]
