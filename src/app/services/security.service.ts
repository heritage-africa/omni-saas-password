import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface PasswordUpdateRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordUpdateResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.apiUrl = this.getApiUrl();
    //console.log('[SecurityService] API URL:', this.apiUrl);
  }

  /**
   * Détermine l'URL API en fonction de l'environnement
   * Compatible avec SSR (Server-Side Rendering)
   */
  private getApiUrl(): string {
    // Vérifier si on est côté client (browser) ou côté serveur (SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Code côté CLIENT (browser)
      const hostname = window.location.hostname;
      const port = window.location.port;

      // Si on est en local DEV (ex: ng serve sur 4200), utiliser des URLs relatives
      // pour permettre au dev-server de proxyer /api vers le backend et éviter
      // des redirections vers :8080 lors d'un refresh.
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0'
      ) {
        // Si on est sur le port de production (8080), utiliser l'URL absolue
        if (port === '8080') {
          return 'http://localhost:8080/api/v1/security';
        }

        // Par défaut (ex: ng serve:4200) utiliser une URL relative
        return '/api/v1/security';
      }

      // Si on est sur un domaine OpenShift ou production
      return '/api/v1/security';
    } else {
      // Code côté SERVEUR (SSR / Node.js)
      // En SSR, on utilise une URL relative qui sera résolue côté client
      return '/api/v1/security';
    }
  }

  /**
   * Évalue la force d'un mot de passe
   * @param password Le mot de passe à évaluer
   * @returns Score de 0 à 4 (0 = faible, 4 = très fort)
   */
  evaluatePasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }

  /**
   * Valide un mot de passe
   * @param password Le mot de passe à valider
   * @returns Objet contenant l'état de validité et les erreurs
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Vérifie si deux mots de passe correspondent
   * @param password Premier mot de passe
   * @param confirmPassword Deuxième mot de passe
   * @returns true si les mots de passe correspondent
   */
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
  }

  /**
   * 1. Changer le mot de passe (Utilisateur connecté)
   * Appelle /sync-password avec Rollback
   */
  updatePassword(request: PasswordUpdateRequest): Observable<PasswordUpdateResponse> {
    return this.http.post<PasswordUpdateResponse>(`${this.apiUrl}/sync-password`, {
      email: request.email,
      oldPassword: request.oldPassword,
      newPassword: request.newPassword,
      confirmPassword: request.confirmPassword
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du mot de passe', error);
        throw error;
      })
    );
  }

  /**
   * 2. Demande de réinitialisation (Mot de passe oublié)
   * Appelle /forgot-password
   */
  requestPasswordReset(emailPro: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, {
      email: emailPro
    });
  }

  /**
   * 3. Valider le nouveau mot de passe (Depuis le lien Email)
   * Appelle /reset-password
   */
  submitResetPassword(token: string, newPass: string, confirmPass: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token: token,
      newPassword: newPass,
      confirmPassword: confirmPass
    });
  }

  /**
   * Génère un mot de passe sécurisé aléatoire
   * @param length Longueur du mot de passe (par défaut 16)
   * @returns Mot de passe généré
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }


  // Appelle l'endpoint /forgot-password
  requestReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, {
      email: email
    });
  }

  // Appelle l'endpoint /reset-password
  submitReset(token: string, newPass: string, confirmPass: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token: token,
      newPassword: newPass,
      confirmPassword: confirmPass
    });
  }

}
