# Stage 1: Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
# Install ALL dependencies, including devDependencies
RUN npm install

# Copy source code and build the project
COPY . .
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Create a non-root user for security [citation:9]
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy only the production dependencies and built application
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# Switch to the non-root user
USER nextjs

# Expose the port your app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "dist/app.js"]
