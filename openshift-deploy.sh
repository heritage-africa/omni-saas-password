#!/bin/bash
# Script de déploiement pour OpenShift
# Usage: ./openshift-deploy.sh [namespace] [image-registry]

set -e

NAMESPACE="${1:-default}"
IMAGE_REGISTRY="${2:-quay.io/heritage-africa}"
APP_NAME="omni365-password"
IMAGE_TAG="latest"
FULL_IMAGE="${IMAGE_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"

echo "======================================"
echo "  OpenShift Deployment Script"
echo "======================================"
echo "Namespace: $NAMESPACE"
echo "Image: $FULL_IMAGE"
echo "App Name: $APP_NAME"
echo ""

# 1. S'assurer qu'on est connecté à OpenShift
echo "[1/5] Vérification de la connexion OpenShift..."
if ! oc status &> /dev/null; then
    echo "❌ Erreur: Vous n'êtes pas connecté à OpenShift"
    echo "   Exécutez: oc login -u <username> -p <password> <cluster-url>"
    exit 1
fi
echo "✓ Connecté à OpenShift"
echo ""

# 2. Créer le namespace s'il n'existe pas
echo "[2/5] Vérification/création du namespace..."
if ! oc get ns "$NAMESPACE" &> /dev/null; then
    oc create ns "$NAMESPACE"
    echo "✓ Namespace '$NAMESPACE' créé"
else
    echo "✓ Namespace '$NAMESPACE' existe"
fi
echo ""

# 3. Builder et pusher l'image Docker
echo "[3/5] Build et push de l'image Docker..."
echo "   Cette étape dépend de votre registry Docker"
echo "   Options:"
echo "   a) Build local et push manual"
echo "   b) Utiliser OpenShift S2I (Source-to-Image)"
echo "   c) Utiliser oc new-app"
echo ""
read -p "Quelle option choisissez-vous? [new-app/manual]: " BUILD_OPTION

if [[ "$BUILD_OPTION" == "new-app" ]]; then
    echo "   Création d'une nouvelle app avec oc new-app..."
    oc new-app \
        --name="$APP_NAME" \
        --docker-image="$FULL_IMAGE" \
        -n "$NAMESPACE" || echo "   (L'app existe peut-être déjà, continuant...)"
    echo "✓ App créée/existante"
elif [[ "$BUILD_OPTION" == "manual" ]]; then
    echo "   Build manual de l'image..."
    docker build -t "$FULL_IMAGE" .
    docker push "$FULL_IMAGE"
    echo "✓ Image poussée vers le registry"
else
    echo "   Using S2I..."
fi
echo ""

# 4. Créer/Mettre à jour la DeploymentConfig
echo "[4/5] Configuration de la DeploymentConfig..."
cat > /tmp/deploymentconfig.yaml <<EOF
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: ${APP_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: ${APP_NAME}
spec:
  replicas: 1
  selector:
    app: ${APP_NAME}
  template:
    metadata:
      labels:
        app: ${APP_NAME}
    spec:
      containers:
      - name: ${APP_NAME}
        image: ${FULL_IMAGE}
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: NGINX_PORT
          value: "8080"
        - name: BACKEND_URL
          value: "http://omni365-password-api:8080"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 101
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
      securityContext:
        fsGroup: 101
---
apiVersion: v1
kind: Service
metadata:
  name: ${APP_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: ${APP_NAME}
spec:
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: ${APP_NAME}
  sessionAffinity: None
  type: ClusterIP
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${APP_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: ${APP_NAME}
spec:
  host: ${APP_NAME}.apps.origins.heritage.africa
  port:
    targetPort: http
  to:
    kind: Service
    name: ${APP_NAME}
    weight: 100
  wildcardPolicy: None
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
    caCertificate: |-
EOF

oc apply -f /tmp/deploymentconfig.yaml
echo "✓ DeploymentConfig appliquée"
echo ""

# 5. Vérifier le statut du déploiement
echo "[5/5] Vérification du statut du déploiement..."
echo "   En attente du pod..."
sleep 5

# Attendre que les pods soient prêts
for i in {1..30}; do
    READY=$(oc get dc "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$READY" == "1" ]; then
        echo "✓ Pod prêt (1/1)"
        break
    fi
    echo "   Tentative $i/30..."
    sleep 2
done

# Afficher les infos
echo ""
echo "======================================"
echo "  ✓ Déploiement Complété!"
echo "======================================"
echo ""
echo "URLs d'Accès:"
echo "  - Frontend: https://${APP_NAME}.apps.origins.heritage.africa"
echo "  - Service interne: http://${APP_NAME}.${NAMESPACE}.svc.cluster.local"
echo ""
echo "Commandes Utiles:"
echo "  Logs:          oc logs -f dc/${APP_NAME} -n ${NAMESPACE}"
echo "  Shell:         oc rsh dc/${APP_NAME} -n ${NAMESPACE}"
echo "  Describe:      oc describe dc/${APP_NAME} -n ${NAMESPACE}"
echo "  Rollout:       oc rollout latest dc/${APP_NAME} -n ${NAMESPACE}"
echo "  Delete:        oc delete all -l app=${APP_NAME} -n ${NAMESPACE}"
echo ""
