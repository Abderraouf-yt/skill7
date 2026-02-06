# Multi-stage build for smaller image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY data ./data

# Build TypeScript
RUN npm install typescript && npx tsc

# Production image
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY package.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_TRANSPORT=http

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the server
CMD ["node", "dist/index.js"]
