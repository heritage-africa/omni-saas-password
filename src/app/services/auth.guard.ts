import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Guard d'authentification pour protéger les routes
 * Empêche les boucles infinies de redirection
 */
@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  private isRedirecting = false;

  constructor(private router: Router) {}

  /**
   * Vérifie si l'utilisateur est authentifié
   * Retourne true si authentifié, false sinon
   */
  isAuthenticated(): boolean {
    // À adapter selon votre système d'authentification
    // Ex: vérifier un token JWT dans localStorage, ou un cookie
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Empêche les redirections infinies
   */
  isAuthError(): boolean {
    return sessionStorage.getItem('auth_error') === 'true';
  }

  getAuthError(): string | null {
    return sessionStorage.getItem('auth_error');
  }

  clearAuthError(): void {
    sessionStorage.removeItem('auth_error');
  }

  setRedirecting(value: boolean): void {
    this.isRedirecting = value;
  }

  getRedirecting(): boolean {
    return this.isRedirecting;
  }
}

/**
 * Fonction guard pour les routes protégées
 * Peut être utilisée si vous avez besoin de protéger certaines routes
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthGuardService);
  const router = inject(Router);

  // Les routes d'authentification sont TOUJOURS accessibles (pas de redirection)
  const publicAuthRoutes = [
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/update-password'
  ];

  if (publicAuthRoutes.some(path => state.url.startsWith(path))) {
    // Utilisateur est déjà sur une route publique d'authentification
    return true;
  }

  // Si déjà en processus de redirection, ne pas rediriger à nouveau
  if (authService.getRedirecting()) {
    return false;
  }

  // Si authentifié, permettre l'accès
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si non authentifié ET pas sur une route d'auth, rediriger vers forgot-password
  authService.setRedirecting(true);
  router.navigate(['/auth/forgot-password'], { queryParams: { returnUrl: state.url } });
  return false;
};
