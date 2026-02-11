# Résumé des Corrections - Redirection infinie /auth/forgot-password/

## 🎯 Problème Original

L'application Angular se redirige infiniment vers `http://localhost:8080/auth/forgot-password/` avec l'erreur:
```
"No static resource auth/forgot-password."
```

## 📝 Fichiers Modifiés

### 1. **nginx.conf** ✅ MODIFIÉ
- Amélioration du routing Angular (SPA)
- Proxy `/api/*` vers le backend Java
- Support des healthchecks OpenShift
- Cache-Control approprié pour `index.html`
- Protection contre les fichiers sensibles

### 2. **Dockerfile** ✅ MODIFIÉ
- Ajout du script d'entrypoint
- Configuration OpenShift-compatible
- Healthcheck pour OpenShift
- Support utilisateur non-root

### 3. **src/app/app.config.ts** ✅ MODIFIÉ
- Enregistrement de l'intercepteur HTTP
- Support de `withInterceptorsFromDi()`
- Configuration du HTTP client correcte

### 4. **docker-entrypoint.sh** ✅ CRÉÉ
- Script de démarrage pour diagnostiquer les problèmes
- Vérification de la configuration NGINX
- Support des variables d'environnement

### 5. **src/app/services/auth.interceptor.ts** ✅ CRÉÉ
- Gestion des erreurs 401 (non authentifié)
- Prévention des redirections infinies
- Support des erreurs CORS
- Logs détaillés pour diagnostic

### 6. **src/app/services/auth.guard.ts** ✅ CRÉÉ
- Guard d'authentification pour les routes protégées
- Empêche les boucles infinies
- Support du `returnUrl`

### 7. **src/app/services/security.service.ts** ✅ MODIFIÉ
- Détection automatique de l'environnement
- URL API configurable (localhost, OpenShift, production)
- Logs du URL API utilisée

### 8. **src/app/auth/auth-init/auth-init.component.ts** ✅ CRÉÉ
- Composant d'initialisation pour gérer le démarrage
- Affiche un loader pendant la redirection
- Gère les erreurs d'authentification

### 9. **OPENSHIFT_FIX.md** ✅ CRÉÉ
- Documentation complète du problème et des solutions
- Architecture recommandée pour OpenShift
- Configuration YAML example
- Troubleshooting guide

### 10. **openshift-deploy.sh** ✅ CRÉÉ
- Script de déploiement automatisé pour OpenShift
- Crée les ressources (DeploymentConfig, Service, Route)
- Vérifie le statut du déploiement

## 🚀 Changements Clés

### Architecture Avant ❌
```
Client → Backend Java (localhost:8080)
         ↓
         Essaie de servir /auth/forgot-password/ comme ressource statique
         ↓
         ERROR: "No static resource auth/forgot-password."
```

### Architecture Après ✅
```
Client → NGINX (8080)
         ↓
         Routes Angular → /index.html (SPA routing)
         Routes API (/api/*) → Proxy vers Backend Java
         ↓
         Frontend Angular gère les routes, Backend gère les APIs
```

## 💡 Points Importants

### Pour le Déploiement OpenShift:

1. **NGINX écoute sur le port 8080** (requis par OpenShift)
2. **Les routes Angular sont servies par index.html** (client-side routing)
3. **Les appels API sont proxifiés vers le backend** (proxy_pass /api/*)
4. **Healthcheck exposé sur /health** (pour OpenShift)

### Configuration Requise:

En production OpenShift, vous devez:

1. **Configurer le backend Java** pour qu'il soit accessible via:
   - Service name: `omni365-password-api`
   - Port: `8080`
   - Ou adapter l'URL dans `security.service.ts`

2. **Configurer CORS** sur le backend (si domaines différents):
   ```java
   .allowedOrigins("https://omni365-password.apps.origins.heritage.africa")
   ```

3. **Vérifier les routes OpenShift**:
   ```bash
   oc get routes
   oc describe route omni365-password
   ```

## 🧪 Tests Recommandés

### 1. Build local:
```bash
npm install
npm run build
docker build -t omni365-password:local .
docker run -p 8080:8080 omni365-password:local
# Accéder à http://localhost:8080
```

### 2. Test d'API:
```bash
# Tester le healthcheck
curl http://localhost:8080/health

# Tester la SPA (doit retourner index.html)
curl http://localhost:8080/any/random/path
curl http://localhost:8080/auth/forgot-password
```

### 3. Test en dev:
```bash
npm start
# Accéder à http://localhost:4200
```

## 📊 Statut des Modifications

| Fichier | Type | Statut | Description |
|---------|------|--------|-------------|
| nginx.conf | Config | ✅ Modificé | Routing SPA + Proxy API |
| Dockerfile | Config | ✅ Modifié | Entrypoint + Healthcheck |
| app.config.ts | Code | ✅ Modifié | Interceptor registré |
| security.service.ts | Code | ✅ Modifié | API URL dynamique |
| auth.interceptor.ts | Code | ✅ Créé | Gestion erreurs auth |
| auth.guard.ts | Code | ✅ Créé | Guard authentification |
| auth-init.component.ts | Code | ✅ Créé | Composant init |
| docker-entrypoint.sh | Script | ✅ Créé | Script démarrage |
| openshift-deploy.sh | Script | ✅ Créé | Script déploiement |
| OPENSHIFT_FIX.md | Doc | ✅ Créé | Documentation complète |

## ⚠️ Points à Vérifier

- [ ] Vérifier que le backend Java est accessible depuis NGINX
- [ ] Tester les appels API avec `curl`:
  ```bash
  curl -v http://localhost:8080/api/v1/security/forgot-password
  ```
- [ ] Vérifier que CORS est configuré correctement sur le backend
- [ ] Tester le healthcheck:
  ```bash
  curl http://localhost:8080/health
  ```
- [ ] Vérifier les logs NGINX pour les erreurs:
  ```bash
  oc logs -f dc/omni365-password
  ```

## 📚 Documentation Additionnelle

- Voir **OPENSHIFT_FIX.md** pour la documentation complète
- Voir **openshift-deploy.sh** pour le script de déploiement
- Voir **docker-entrypoint.sh** pour les diagnostics

## 🆘 Support

Si vous avez des problèmes:

1. **Vérifier les logs**: `oc logs -f dc/omni365-password`
2. **Vérifier la config NGINX**: `oc rsh dc/omni365-password cat /etc/nginx/conf.d/default.conf`
3. **Tester la connectivité backend**: `oc rsh dc/omni365-password curl http://omni365-password-api:8080`
4. **Revoir OPENSHIFT_FIX.md** pour le troubleshooting complet

---

**Date**: 11 Février 2026
**Auteur**: GitHub Copilot
**Version**: 1.0
