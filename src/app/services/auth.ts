import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Récupère l'email de l'utilisateur actuellement connecté.
   * Récupère les données depuis le localStorage (objet user stocké).
   * Fonctionne uniquement côté client.
   */
  getUserEmail(): string {
    // Vérifier que nous sommes côté client (pas SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || user.username || '';
      } catch (error) {
        console.error('Erreur lors du parsing du user:', error);
        return '';
      }
    }
    return '';
  }
}
