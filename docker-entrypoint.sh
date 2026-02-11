#!/bin/sh
# Docker entrypoint script pour OpenShift
# Configure NGINX dynamiquement selon l'environnement

set -e

# Répertoire de travail
NGINX_CONF_DIR="/etc/nginx/conf.d"
APP_ROOT="/usr/share/nginx/html"

# Logs
echo "[Init] Démarrage de NGINX pour Angular avec support OpenShift..."

# 1. Vérifier que les fichiers Angular sont bien packés
if [ ! -f "$APP_ROOT/index.html" ]; then
    echo "[ERROR] index.html not found in $APP_ROOT"
    exit 1
fi

echo "[Init] ✓ Angular app found at $APP_ROOT"

# 2. Afficher les variables d'environnement pour le diagnostic
echo "[Init] Configuration OpenShift:"
echo "  - NGINX_PORT: ${NGINX_PORT:-8080}"
echo "  - BACKEND_URL: ${BACKEND_URL:-localhost:8080}"

# 3. Optionnel: Remplacer les variables d'environnement dans la config NGINX
# Si vous avez besoin de faire du templating dans nginx.conf
if [ -n "$BACKEND_API_PATH" ]; then
    echo "[Init] Configuration de l'API backend: $BACKEND_API_PATH"
fi

# 4. Vérifier les permissions (important pour OpenShift non-root)
echo "[Init] Vérification des permissions..."
if [ ! -w "$NGINX_CONF_DIR" ]; then
    echo "[WARN] Directory $NGINX_CONF_DIR is not writable"
fi

if [ ! -w "$APP_ROOT" ]; then
    echo "[WARN] Directory $APP_ROOT is not writable (normal for read-only FS)"
fi

# 5. Afficher la config nginx (pour diagnostic)
echo "[Init] Configuration NGINX chargée:"
nginx -t 2>&1 | grep -E "successful|test"

# 6. Démarrer NGINX
echo "[Init] ✓ Démarrage de NGINX..."
exec nginx -g 'daemon off;'
