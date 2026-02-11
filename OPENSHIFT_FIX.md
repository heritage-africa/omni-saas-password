# Fix: Redirection Infinité vers /auth/forgot-password/ sur OpenShift

## 🔴 Problème

L'application Angular se redirige infiniment vers `http://localhost:8080/auth/forgot-password/` avec l'erreur:

```json
{
  "success": false,
  "error": {
    "message": "No static resource auth/forgot-password.",
    "type": "INTERNAL_SERVER_ERROR"
  }
}
```

## 🎯 Cause Racine

1. Le **backend Java** gère l'authentification et redirige les utilisateurs non authentifiés vers `/auth/forgot-password/`
2. Mais cette route **n'existe que côté frontend Angular**, pas comme ressource statique du backend
3. Quand NGINX envoie la requête au backend Java, celui-ci essaie de la servir comme une ressource statique → ERROR

## ✅ Solutions Mises en Place

### 1. **Configuration NGINX Améliorée** (`nginx.conf`)

- ✓ Routing Angular SPA correctement configuré (`try_files $uri $uri/ /index.html`)
- ✓ Proxy pour les appels API vers le backend: `/api/*` → Backend Java
- ✓ Cache-Control approprié pour `index.html` (pas de cache)
- ✓ Support des healthchecks OpenShift (`/health`, `/healthz`)

### 2. **Intercepteur HTTP** (`auth.interceptor.ts`)

- ✓ Gère les erreurs 401 (Non authentifié)
- ✓ Prévient les redirections infinies avec un compteur
- ✓ Logs détaillés pour le diagnostic
- ✓ Supporte les erreurs CORS et de connexion

### 3. **Guard d'Authentification** (`auth.guard.ts`)

- ✓ Fonction guard réutilisable pour les routes protégées
- ✓ Empêche les boucles infinies de redirection
- ✓ Support du `returnUrl` pour les redirections intelligentes

### 4. **API Dynamique** (`security.service.ts`)

- ✓ Détection automatique de l'environnement (localhost, OpenShift, production)
- ✓ URL API configurable selon le contexte
- ✓ Logs de diagnostic pour vérifier l'URL utilisée

### 5. **Docker & OpenShift**

#### Dockerfile amélioré:
- ✓ Script d'entrypoint pour configuration dynamique
- ✓ Healthcheck pour OpenShift
- ✓ Support utilisateur non-root (unprivileged)
- ✓ Optimisations pour OpenShift

#### `docker-entrypoint.sh`:
- ✓ Vérification de la configuration NGINX
- ✓ Affichage des variables d'environnement
- ✓ Diagnostic automatique

## 🚀 Déploiement sur OpenShift

### Architecture Recommandée:

```
┌─────────────────────────────────────────────────────────┐
│                     OpenShift (Kubernetes)              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │  NGINX (10.0.0.1:8080)                           │   │
│  │  - Port 8080 (HTTP)                              │   │
│  │  - Serve Angular SPA                             │   │
│  │  - Proxy /api/* → Backend Java                   │   │
│  └──────────────────────────────────────────────────┘   │
│         ↓ (REST API calls)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Backend Java (Service omni365-password-api)     │   │
│  │  - Port 8080 ou autre                            │   │
│  │  - Gère l'authentification                        │   │
│  │  - Expose /api/v1/security/*                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Configuration OpenShift (Example DeploymentConfig):

```yaml
apiVersion: v1
kind: DeploymentConfig
metadata:
  name: omni365-password-frontend
spec:
  replicas: 1
  selector:
    app: omni365-password-frontend
  template:
    metadata:
      labels:
        app: omni365-password-frontend
    spec:
      containers:
      - name: nginx
        image: omni365-password:latest
        ports:
        - containerPort: 8080
        env:
        - name: BACKEND_URL
          value: "http://omni365-password-api:8080"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: omni365-password-frontend
spec:
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: omni365-password-frontend
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: omni365-password-frontend
spec:
  host: omni365-password.apps.origins.heritage.africa
  port:
    targetPort: 8080
  to:
    kind: Service
    name: omni365-password-frontend
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

## 🔧 Configuration Requise

### Variables d'Environnement

```bash
# URL du backend (optionnel, auto-détecté par défaut)
BACKEND_URL=http://omni365-password-api:8080

# Port NGINX (OpenShift utilise 8080)
NGINX_PORT=8080
```

### CORS (Important!)

Si le backend Java est sur un domaine différent, assurez-vous que CORS est configuré correctement:

**Backend Java (Spring Security):**

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://omni365-password.apps.origins.heritage.africa")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

## 🧪 Tests Locaux

### Build & Test Docker Localement:

```bash
# Build l'image
docker build -t omni365-password:latest .

# Run le conteneur
docker run -p 8080:8080 omni365-password:latest

# Test dans un autre terminal
curl http://localhost:8080/health
curl http://localhost:8080/
```

### Test avec ng serve:

```bash
npm install
npm start
# Accéder à http://localhost:4200
```

## 📋 Checklist de Déploiement

- [ ] Vérifier que le backend Java est accessible depuis NGINX
- [ ] Configurer les routes OpenShift avec les bons domaines
- [ ] Activer HTTPS/TLS edge termination
- [ ] Configurer les healthchecks OpenShift
- [ ] Tester les endpoints `/health` et `/healthz`
- [ ] Vérifier les logs NGINX pour les erreurs:
  ```bash
  oc logs -f dc/omni365-password-frontend
  ```
- [ ] Monitoringer les appels API et les erreurs d'authentification

## 🐛 Diagnostic & Troubleshooting

### Vérifier les logs:

```bash
# Logs NGINX
oc logs -f pod/omni365-password-frontend-xxx

# Vérifier la configuration NGINX dans le pod
oc rsh pod/omni365-password-frontend-xxx cat /etc/nginx/conf.d/default.conf

# Test de connectivité vers le backend
oc rsh pod/omni365-password-frontend-xxx curl http://omni365-password-api:8080/api/v1/security

# Vérifier les ports exposés
oc describe svc omni365-password-frontend
```

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `No static resource auth/forgot-password` | Backend JSON reçoit les requêtes SPA | Vérifier la config NGINX, proxy `/api/*` uniquement |
| `CORS error` | Backend n'autorise pas les appels cross-origin | Configurer CORS sur le backend Java |
| `Connection refused` | Backend Java inaccessible | Vérifier le service name dans le cluster |
| `502 Bad Gateway` | NGINX ne peut pas proxifier vers le backend | Vérifier que le backend est up et accessible |

## 📚 Ressources

- [NGINX Location Priority](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [Angular SPA Routing with NGINX](https://angular.io/guide/deployment#production-serving)
- [OpenShift Best Practices](https://docs.openshift.com/container-platform/latest/welcome/index.html)
- [Spring Security CORS](https://spring.io/guides/gs/cors-rest-service/)

---

**Date de dernière mise à jour:** 11 Février 2026
**Auteur:** GitHub Copilot
