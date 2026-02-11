# --- PHASE 1 : Build Angular application ---
FROM node:20.19.0 AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm install

COPY . .

# Build l'application Angular avec la configuration production
RUN npm run build

# --- PHASE 2 : Serve Angular app with NGINX (OpenShift-compatible) ---
FROM nginxinc/nginx-unprivileged:1.27-alpine

# NGINX listens on 8080 for OpenShift compatibility
COPY --from=builder /app/dist/omni365-saas-password/browser/ /usr/share/nginx/html/

# Copy NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for dynamic configuration (with execute permissions)
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

USER 101

# Health check for OpenShift
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port 8080 for OpenShift
EXPOSE 8080

# Use entrypoint script to handle dynamic configuration
ENTRYPOINT ["/docker-entrypoint.sh"]

