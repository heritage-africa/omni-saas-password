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

USER 101

# CORRECTION : Chemin pour Angular 17+ avec le nouveau builder
COPY --from=builder /app/dist/omni365-saas-password/browser/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

