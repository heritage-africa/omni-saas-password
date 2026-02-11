#!/bin/bash
# Quick Start Guide - Omni365 Password frontend on OpenShift

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Omni365 SaaS Password - OpenShift Quick Start             ║"
echo "║  Fix: Redirection infinie /auth/forgot-password/           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="omni365-password"
NAMESPACE="${NAMESPACE:-default}"
BACKEND_HOST="${BACKEND_HOST:-omni365-password-api}"
OPENSHIFT_DOMAIN="${OPENSHIFT_DOMAIN:-apps.origins.heritage.africa}"

show_menu() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo "MENU PRINCIPAL"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "1) 🔨 Build local (Docker)"
    echo "2) 🚀 Déployer sur OpenShift"
    echo "3) 📖 Voir la documentation complète"
    echo "4) 🐛 Diagnostiquer les problèmes"
    echo "5) 🧪 Tester en local (npm start)"
    echo "6) ℹ️  Afficher les configurations"
    echo "7) ❌ Quitter"
    echo ""
    read -p "Choisissez une option (1-7): " choice
}

build_local() {
    echo -e "\n${BLUE}═ Build Docker Local ═${NC}\n"
    echo "1️⃣  Installation des dépendances..."
    npm install

    echo -e "\n2️⃣  Build Angular..."
    npm run build

    echo -e "\n3️⃣  Build de l'image Docker..."
    docker build -t ${APP_NAME}:local .

    echo -e "\n${GREEN}✓ Image créée: ${APP_NAME}:local${NC}"
    echo ""

    read -p "Voulez-vous lancer le conteneur? (y/n): " run_container
    if [[ $run_container == "y" ]]; then
        echo -e "\n4️⃣  Lancement du conteneur..."
        docker run -p 8080:8080 ${APP_NAME}:local
    fi
}

deploy_openshift() {
    echo -e "\n${BLUE}═ Déploiement OpenShift ═${NC}\n"

    # Vérifier la connexion
    echo "1️⃣  Vérification de la connexion OpenShift..."
    if ! oc status &> /dev/null; then
        echo -e "${RED}❌ Vous n'êtes pas connecté à OpenShift${NC}"
        echo "   Exécutez: oc login -u <username> -p <password> <cluster-url>"
        return 1
    fi
    echo -e "${GREEN}✓ Connecté à OpenShift${NC}"

    # Sélectionner le namespace
    echo -e "\n2️⃣  Sélection du namespace..."
    echo "Namespaces disponibles:"
    oc get ns -o name | sed 's/namespace\//  - /'
    read -p "Namespace cible [$NAMESPACE]: " selected_ns
    NAMESPACE="${selected_ns:-$NAMESPACE}"

    # Créer le namespace s'il n'existe pas
    if ! oc get ns "$NAMESPACE" &> /dev/null; then
        echo "   Création du namespace '$NAMESPACE'..."
        oc create ns "$NAMESPACE"
    fi
    oc project "$NAMESPACE"

    # Build et push l'image
    echo -e "\n3️⃣  Build et push de l'image Docker..."
    read -p "Registry Docker (quay.io/heritage-africa): " registry
    registry="${registry:-quay.io/heritage-africa}"

    echo "   Build..."
    docker build -t ${registry}/${APP_NAME}:latest .

    echo "   Push..."
    docker push ${registry}/${APP_NAME}:latest
    echo -e "${GREEN}✓ Image poussée${NC}"

    # Déployer
    echo -e "\n4️⃣  Déploiement des ressources sur OpenShift..."
    bash openshift-deploy.sh "$NAMESPACE" "$registry"

    echo -e "\n${GREEN}✓ Déploiement complété!${NC}"
    echo ""
    echo "URL d'accès:"
    echo -e "  ${BLUE}https://${APP_NAME}.${OPENSHIFT_DOMAIN}${NC}"
}

show_docs() {
    echo -e "\n${BLUE}═ Documentation ═${NC}\n"
    echo "1️⃣  Problème et solution complèts"
    echo "2️⃣  Configuration NGINX"
    echo "3️⃣  Configuration OpenShift"
    echo "4️⃣  Troubleshooting"
    echo ""
    read -p "Quelle documentation voir? (1-4): " doc_choice

    case $doc_choice in
        1)
            less OPENSHIFT_FIX.md
            ;;
        2)
            less nginx.conf
            ;;
        3)
            less openshift-deploy.sh
            ;;
        4)
            echo -e "${YELLOW}Voir 'Troubleshooting' dans OPENSHIFT_FIX.md${NC}"
            less OPENSHIFT_FIX.md
            ;;
    esac
}

diagnose() {
    echo -e "\n${BLUE}═ Diagnostic ═${NC}\n"

    echo "1️⃣  Vérification de la connexion OpenShift..."
    if ! oc status &> /dev/null; then
        echo -e "${RED}❌ Non connecté à OpenShift${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Connecté${NC}"

    echo -e "\n2️⃣  Statut du déploiement '${APP_NAME}'..."
    oc get pods -l app=${APP_NAME} --all-namespaces

    echo -e "\n3️⃣  Logs du pod..."
    read -p "Afficher les logs du pod? (y/n): " show_logs
    if [[ $show_logs == "y" ]]; then
        oc logs -f dc/${APP_NAME} --all-namespaces
    fi

    echo -e "\n4️⃣  Tester le healthcheck..."
    read -p "URL du service (http://localhost:8080): " service_url
    service_url="${service_url:-http://localhost:8080}"

    curl -v "${service_url}/health" 2>&1 | head -20

    echo -e "\n5️⃣  Tester une route SPA..."
    curl -s "${service_url}/auth/forgot-password" | grep -o '<title>.*</title>'
}

test_local() {
    echo -e "\n${BLUE}═ Test Local avec npm ═${NC}\n"

    echo "1️⃣  Installation des dépendances..."
    npm install

    echo -e "\n${GREEN}✓ Démarrage du serveur de developpement...${NC}"
    echo "   Le navigateur s'ouvrira automatiquement sur http://localhost:4200"
    echo ""
    npm start
}

show_config() {
    echo -e "\n${BLUE}═ Configuration ═${NC}\n"

    echo "📋 Configuration Actuelle:"
    echo "  App: ${APP_NAME}"
    echo "  Namespace: ${NAMESPACE}"
    echo "  Backend: ${BACKEND_HOST}"
    echo "  OpenShift Domain: ${OPENSHIFT_DOMAIN}"
    echo ""

    echo "📄 VERSION DU PROJET:"
    grep '"version"' package.json | head -1

    echo ""
    echo "📦 DÉPENDANCES PRINCIPALES:"
    grep -E '"@angular|express|nginx"' package.json | head -5

    echo ""
    echo "🐳 DOCKERFILE:"
    echo "  Base Image: nginxinc/nginx-unprivileged:1.27-alpine"
    echo "  Port: 8080"
    echo "  User: 101 (non-root)"

    echo ""
    echo "⚙️  FICHIERS DE CONFIGURATION:"
    echo "  - nginx.conf           (routing SPA + proxy API)"
    echo "  - Dockerfile           (build + deploy)"
    echo "  - docker-entrypoint.sh (configuration dynamique)"
    echo "  - app.config.ts        (configuration Angular)"
}

# Main loop
while true; do
    show_menu

    case $choice in
        1)
            build_local
            ;;
        2)
            deploy_openshift
            ;;
        3)
            show_docs
            ;;
        4)
            diagnose
            ;;
        5)
            test_local
            ;;
        6)
            show_config
            ;;
        7)
            echo -e "${GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Option invalide${NC}"
            ;;
    esac

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
done
