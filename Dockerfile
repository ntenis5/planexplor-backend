# Faza 1: Faza e Ndërtimit (Builder Stage) - Node 20 LTS
FROM node:20-alpine AS builder

# 1. Vendos folderin e punës
WORKDIR /app

# 2. Kopjo skedarët e varësive për të shfrytëzuar Kashin e Docker.
# Kopjo vetëm package.json (Ky ekziston gjithmonë)
COPY package.json ./
# Faza 1.5 (Zgjidhet problemi i lstat):
# Kopjo package-lock.json NËSE ekziston, duke e bërë atë opsional nëpërmjet .dockerignore.
# Por meqenëse nuk ke terminal, thjesht do të bëjmë COPY vetëm package.json dhe do të përdorim npm install.

# 3. Instalimi i të gjitha varësive (npm install)
# Kjo është më e ngadaltë se npm ci, por funksionon pa package-lock.json.
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

# 4. Instalimi i varësive të prodhimit
# Ne e kërkojmë vetëm npm install --production. Kjo është e shpejtë dhe e qëndrueshme.
RUN npm install --production

# 5. Kopjo kodin e kompajlluar (JS)
COPY --from=builder /app/dist ./dist

# 6. Ekspozimi i portës
EXPOSE 8080

# 7. Komanda për të nisur aplikacionin
CMD ["node", "dist/app.js"]
