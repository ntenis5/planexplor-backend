# ----------------------------------------------------
# FAZA 1: BUILD STAGE (Kompajllimi i TypeScript)
# Përdor Node.js 20 (LTS) - më i shpejtë dhe i përditësuar.
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Instalo varësitë e ndërtimit (dev + prod)
# Kjo shfrytëzon kashin (cache) e Docker-it: nëse package.json nuk ndryshon,
# kjo fazë nuk ekzekutohet përsëri.
COPY package.json package-lock.json ./
RUN npm install

# 2. Kopjo kodin burimor dhe kompajlloje
# Në këtë fazë, kompajlohet kodi TS në JS (npm run build)
COPY . .
# Shënim: Pas rregullimit të app.ts, kjo komandë nuk do të dështojë më.
RUN npm run build 

# ----------------------------------------------------
# FAZA 2: PRODUCTION STAGE (Imazhi Final Minimalist)
# Kjo është imazhi që do të dërgohet në Railway: i vogël dhe i sigurt.
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Konfiguro variablat thelbësore të ambientit
ENV NODE_ENV=production
# 🚀 Për siguri, Railway rekomandon që aplikacioni të mos punojë si root
# Kjo komandë duhet të punojë, nëse kemi problem e heqim.
# RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 3. Kopjo vetëm varësitë e prodhimit (package.json)
# Kjo ndihmon kashin dhe shmang kopjimin e varësive të panevojshme.
COPY --from=builder /app/package.json /app/package-lock.json ./

# 4. Instalo vetëm varësitë e prodhimit në mjedisin final
# Përdorimi i 'npm ci --production' është praktikë më e mirë se 'npm install --production'
# sepse punon me package-lock.json dhe është më i shpejtë e i saktë.
RUN npm ci --production --silent

# 5. Kopjo kodin e kompajlluar (JS) nga faza 'builder'
# Kopjohet VETËM folderi 'dist' (i kompajlluar)
COPY --from=builder /app/dist ./dist

# 6. Ndërro te përdoruesi jo-root për siguri maksimale
# USER nodejs 

# Ekspozoni portën (Railway e menaxhon vetë këtë, por është praktikë e mirë)
EXPOSE 8080

# Komanda për të nisur aplikacionin
# Nis aplikacionin e kompajlluar: dist/app.js
CMD ["node", "dist/app.js"]
