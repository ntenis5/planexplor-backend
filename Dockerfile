# Faza 1: Faza e Ndërtimit (BUILDER STAGE)
# Përdor Node 20 LTS për shpejtësi dhe qëndrueshmëri
FROM node:20-alpine AS builder

# 1. Vendos folderin e punës
WORKDIR /app

# 2. Kopjo skedarët e varësive për të shfrytëzuar Kashin e Docker
COPY package.json ./

# 3. Instalimi i të gjitha varësive (npm install)
# Përdorim npm install (më i tolerueshëm) pasi package-lock.json nuk gjenerohet në telefon.
RUN npm install

# 4. Kopjo kodin burimor dhe kompajllo (build) projektin
COPY . .
RUN npm run build

# Faza 2: Faza e Prodhimit (PRODUCTION STAGE)
# Përdor Node 20 LTS (më i vogël dhe më i sigurt)
FROM node:20-alpine AS runner

# 1. Vendos folderin e punës
WORKDIR /app

# 2. Konfigurimi i Sigurisë: Krijo një përdorues jo-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs

# 3. I japim pronësinë e folderit `/app` përdoruesit të ri!
# ZGJIDHJA KRITIKE PËR GABIMIN EACCES
RUN chown -R nodeapp:nodejs /app

# 4. Ndërrimi te përdoruesi jo-root
USER nodeapp

# 5. Kopjo vetëm skedarët e prodhimit
COPY --from=builder /app/package.json ./

# 6. Instalimi i varësive të prodhimit
# Tani që jemi si 'nodeapp', ky instalim do të shkruajë në /app/node_modules pa gabime lejesh.
RUN npm install --production

# 7. Kopjo kodin e kompajlluar (JS)
COPY --from=builder /app/dist ./dist

# 8. Ekspozimi i portës
EXPOSE 8080

# 9. Komanda për të nisur aplikacionin
CMD ["node", "dist/app.js"]
