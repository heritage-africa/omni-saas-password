import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

// --- INTERFACES ---

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

// Interface pour la réponse du "Forgot Password" (Email masqué)
// export interface ForgotPasswordResponse {
//   message: string;
//   maskedEmail?: string; // Optionnel : présent seulement si l'user existe et a un mail de secours
// }

export interface ForgotPasswordResponse {
  success: boolean;      // ✅ Ajouté selon votre JSON
  message: string;
  maskedEmail?: string;  // ✅ Le champ clé pour l'affichage
}

// Configuration de l'API (Décommentez la ligne de prod lors du déploiement)
// const API_URL = 'https://omni365-saas-api.apps.origins.heritage.africa/api/v1/security';
const API_URL = 'http://localhost:8080/api/v1/security';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  constructor(private http: HttpClient) { }

  // =================================================================
  // 1. UTILITAIRES (Helpers)
  // =================================================================

  /**
   * Évalue la force d'un mot de passe (0 à 4)
   */
  evaluatePasswordStrength(password: string): number {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }

  /**
   * Valide les règles métier du mot de passe
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
   * Vérifie la correspondance des deux champs
   */
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
  }

  /**
   * Génère un mot de passe sécurisé aléatoire
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // On s'assure d'avoir au moins un de chaque type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // On complète le reste
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mélange final
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // =================================================================
  // 2. APPELS API (HTTP)
  // =================================================================

  /**
   * CAS 1 : Changement de mot de passe (Utilisateur connecté)
   * Endpoint: /sync-password
   */
  updatePassword(request: PasswordUpdateRequest): Observable<PasswordUpdateResponse> {
    return this.http.post<PasswordUpdateResponse>(`${API_URL}/sync-password`, {
      email: request.email,
      oldPassword: request.oldPassword,
      newPassword: request.newPassword,
      confirmPassword: request.confirmPassword
    }).pipe(
      catchError(error => {
        console.error('Erreur update password', error);
        throw error;
      })
    );
  }

  /**
   * CAS 2 : Mot de passe oublié (Demande de lien)
   * Endpoint: /forgot-password
   */
  requestReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${API_URL}/forgot-password`, {
      email: email
    });
  }

  /**
   * CAS 3 : Validation du nouveau mot de passe (Depuis le lien email)
   * Endpoint: /reset-password
   */
  submitReset(token: string, newPass: string, confirmPass: string): Observable<any> {
    return this.http.post(`${API_URL}/reset-password`, {
      token: token,
      newPassword: newPass,
      confirmPassword: confirmPass
    });
  }
}
