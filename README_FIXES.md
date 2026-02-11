Pour lancer rapidement l'application:

## 🚀 Quick Start

### Option 1: Test Local (Recommandé)
```bash
npm install
npm start
# Ouvre http://localhost:4200
```

### Option 2: Avec Docker Local
```bash
docker build -t omni365-password:local .
docker run -p 8080:8080 omni365-password:local
# Accéder à http://localhost:8080
```

### Option 3: Déployer sur OpenShift
```bash
chmod +x QUICKSTART.sh openshift-deploy.sh
./QUICKSTART.sh
# Menu interactif pour le déploiement
```

## 📚 Documentation

- **[OPENSHIFT_FIX.md](OPENSHIFT_FIX.md)** - Solution complète du problème de redirection
- **[CORRECTIONS_SUMMARY.md](CORRECTIONS_SUMMARY.md)** - Résumé des modifications apportées
- **[QUICKSTART.sh](QUICKSTART.sh)** - Script interactif pour build/deploy

## 🔍 Problème Résolu

**Erreur:** Redirection infinie vers `/auth/forgot-password/` avec le message:
```
"No static resource auth/forgot-password."
```

**Cause:** Le backend Java tentait de servir les routes Angular comme des ressources statiques.

**Solution:** 
- ✅ Configuration NGINX optimisée pour SPA routing
- ✅ Proxy API vers le backend Java
- ✅ Intercepteur HTTP pour gérer les erreurs d'authentification
- ✅ Configuration Docker/OpenShift compatible

## 📝 Fichiers Modifiés

### Configuration
- `nginx.conf` - Routing SPA + proxy API
- `Dockerfile` - Build + OpenShift support
- `docker-entrypoint.sh` - Script de démarrage

### Code Angular
- `src/app/app.config.ts` - Interceptor HTTP
- `src/app/services/security.service.ts` - URL API dynamique
- `src/app/services/auth.interceptor.ts` - Gestion erreurs 401
- `src/app/services/auth.guard.ts` - Guard authentification
- `src/app/auth/auth-init/auth-init.component.ts` - Composant init

### Scripts & Docs
- `openshift-deploy.sh` - Déploiement automatisé
- `OPENSHIFT_FIX.md` - Documentation complète
- `CORRECTIONS_SUMMARY.md` - Résumé des changements
- `QUICKSTART.sh` - Menu interactif

## 🧪 Tests

### Healthcheck
```bash
curl http://localhost:8080/health
# Output: healthy
```

### SPA Routing (doit retourner index.html)
```bash
curl http://localhost:8080/auth/forgot-password
grep "<title>" # Doit afficher le titre HTML
```

### API (en production)
```bash
curl -X POST http://localhost:8080/api/v1/security/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

## 🛠️ Configuration

### Variables d'Environnement (Optional)
```bash
NGINX_PORT=8080                    # Port NGINX
BACKEND_URL=http://localhost:8080  # URL du backend
```

### CORS (Important pour OpenShift)

Si le backend est sur un domaine différent, configurez CORS:

```java
// Backend Spring Security
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://omni365-password.apps.origins.heritage.africa")
            .allowedMethods("*")
            .allowCredentials(true);
    }
}
```

## 📊 Architecture

```
┌─────────────────────────────────────┐
│   NGINX (Frontend SPA)              │
│   - Port 8080                       │
│   - Serve /index.html               │
│   - Proxy /api/* → Backend          │
└────────────┬────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
             ▼                             ▼
    ┌──────────────────┐      ┌───────────────────┐
    │  Angular Routes  │      │  Backend Java     │
    │  /              │      │  /api/v1/security │
    │  /auth/*        │      │  - Authentification│
    │  (Client-side)  │      │  - Business Logic │
    └──────────────────┘      └───────────────────┘
```

## 📋 Checklist de Déploiement

- [ ] Vérifier la connexion OpenShift: `oc login`
- [ ] Configurer les répertoires: `oc status`
- [ ] Tester le build local: `docker build .`
- [ ] Configurer le backend Java
- [ ] Exécuter: `./openshift-deploy.sh`
- [ ] Vérifier le statut: `oc get pods`
- [ ] Tester les healthchecks: `curl /health`
- [ ] Vérifier les logs: `oc logs -f dc/omni365-password`

## 🆘 Troubleshooting

| Problème | Solution |
|----------|----------|
| `CORS error` | Configurer CORS sur le backend |
| `503 Service Unavailable` | Vérifier que le backend est up |
| `Pod not ready` | Voir les logs: `oc logs dc/omni365-password` |
| `Route not found` | Vérifier: `oc get route` |
| `Static resource not found` | Vérifier nginx.conf try_files |

Voir [OPENSHIFT_FIX.md](OPENSHIFT_FIX.md) pour plus de détails.

## 📞 Support

- Logs: `oc logs -f dc/omni365-password`
- Shell: `oc rsh dc/omni365-password`
- Config: `oc describe dc omni365-password`
- Routes: `oc get routes -o wide`

## 📖 Ressources

- [Angular Deployment](https://angular.io/guide/deployment)
- [NGINX Location Directives](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [OpenShift Documentation](https://docs.openshift.com/)
- [Spring Security CORS](https://spring.io/guides/gs/cors-rest-service/)

---

**Dernière mise à jour:** 11 Février 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
