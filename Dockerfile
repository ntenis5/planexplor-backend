# Faza 1: Faza e Ndërtimit (Builder Stage) - Përdor Node 20 LTS për shpejtësi dhe qëndrueshmëri
FROM node:20-alpine AS builder

# 1. Vendos folderin e punës
WORKDIR /app

# 2. Kopjo skedarët e varësive për të shfrytëzuar Kashin e Docker.
# Kjo është fleksibël dhe nuk kërkon domosdoshmërisht package-lock.json (npm install)
COPY package.json ./
# Kopjo package-lock.json nëse ekziston (për qëndrueshmëri maksimale)
COPY package-lock.json ./ || true

# 3. Instalimi i të gjitha varësive (npm install është më i tolerueshëm pa package-lock.json se npm ci)
RUN npm install

# 4. Kopjo kodin burimor dhe kompajllo (build) projektin TS në JS
COPY . .
RUN npm run build

# Faza 2: Faza e Prodhimit (Production Stage) - Imazh i Vogël dhe i Sigurt
FROM node:20-alpine AS runner

# 1. Vendos folderin e punës
WORKDIR /app

# 2. Konfigurim i Sigurisë: Krijo një përdorues jo-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs
USER nodeapp

# 3. Kopjo vetëm skedarët e prodhimit
# Kopjo package.json
COPY --from=builder /app/package.json ./

# 4. Instalimi i varësive të prodhimit me npm ci (Kërkon package.json, por nuk kërkon package-lock.json)
# Duke qenë se kemi vetëm package.json, ne mund të përdorim npm install --production.
# Për të siguruar shpejtësi dhe pastërti, do të përdorim npm install --production.
RUN npm install --production --prefer-offline

# 5. Kopjo kodin e kompajlluar (JS)
COPY --from=builder /app/dist ./dist

# 6. Ekspozimi i portës (Railway zakonisht përdor 8080 si parazgjedhje)
EXPOSE 8080

# 7. Komanda për të nisur aplikacionin
CMD ["node", "dist/app.js"]
