FROM node:18-alpine
WORKDIR /app

# Kopjo package files
COPY package*.json ./

# Përdor npm install në vend të npm ci
RUN npm install --omit=dev

# Kopjo të gjithë kodin
COPY . .

# Build aplikacionin
RUN npm run build

# Expose portin që përdor Railway (8080)
EXPOSE 8080

# Nis aplikacionin
CMD ["npm", "start"]
