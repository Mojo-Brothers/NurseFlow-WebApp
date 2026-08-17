# ==============================================================================
# NurseFlow Enterprise HIS 2026 — Multi-Stage Production Dockerfile
# Stage 1: Build Production Assets
# Stage 2: Serve with High-Performance Nginx Alpine
# ==============================================================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies strictly
RUN npm ci

# Copy full application code
COPY . .

# Compile Vite Production Bundle
RUN npm run build

# --- Stage 2: Production Web Server ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
