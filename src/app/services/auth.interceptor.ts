import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AuthGuardService } from './auth.guard';

/**
 * Intercepteur HTTP pour gérer les erreurs d'authentification
 * Redirige vers forgot-password uniquement en cas d'erreur 401 (Unauthorized)
 * Prévient les redirections infinies
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private redirectionAttempts = 0;
  private maxRedirectionAttempts = 1;

  constructor(private router: Router, private authGuard: AuthGuardService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Les routes d'authentification ne doivent pas être redirigées
        const publicAuthRoutes = [
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/update-password'
        ];

        const currentUrl = this.router && this.router.url ? this.router.url : window.location.pathname;
        const isOnAuthRoute = publicAuthRoutes.some((path) => currentUrl.includes(path));

        // 401 = Non authentifié
        if (error.status === 401 && !isOnAuthRoute) {
          console.warn('[Auth] Session expirée ou non authentifié (401)');

          // Préventer les redirections infinies
          if (this.redirectionAttempts < this.maxRedirectionAttempts) {
            this.redirectionAttempts++;
            this.authGuard.setRedirecting(true);

            // Stocker l'erreur et la redirection en cours
            sessionStorage.setItem('auth_error', 'true');
            sessionStorage.setItem('last_auth_attempt', new Date().toISOString());

            // Utiliser la navigation du Router pour éviter les reloads et boucles
            try {
              this.router.navigate(['/auth/forgot-password']);
            } catch (navErr) {
              // Fallback: si navigation échoue, faire une redirection complète
              window.location.href = '/auth/forgot-password';
            }

            // Ne pas propager l'erreur après la redirection
            return EMPTY as unknown as Observable<HttpEvent<any>>;
          }
        }
        // 403 = Accès refusé
        else if (error.status === 403) {
          console.warn('[Auth] Accès refusé (403)');
          sessionStorage.setItem('auth_error', 'forbidden');
        }
        // 500 = Erreur serveur
        else if (error.status === 500) {
          console.error('[Auth] Erreur serveur interne (500)', error);
        }
        // 0 = Erreur de connexion (CORS, réseau, etc.)
        else if (error.status === 0) {
          console.error('[Auth] Erreur de connexion ou CORS', error);
          // Vérifier si c'est une erreur CORS depuis le backend
          if (error.error instanceof ProgressEvent) {
            console.error('Erreur CORS: Le backend n\'est pas accessible');
          }
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Réinitialise les compteurs de tentatives (à appeler après une redirection réussie)
   */
  resetRedirectionAttempts(): void {
    this.redirectionAttempts = 0;
  }
}

