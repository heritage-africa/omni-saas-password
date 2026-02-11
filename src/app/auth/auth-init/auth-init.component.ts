import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthGuardService } from '../../services/auth.guard';

/**
 * Composant d'initialisation pour gérer les erreurs d'authentification
 * Affiche un message pendant que la redirection se fait
 */
@Component({
  selector: 'app-auth-init',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="text-center">
        <div class="mb-4">
          <i class="fas fa-spinner animate-spin text-4xl text-orange-600"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Initialisation...</h2>
        <p class="text-gray-600">Veuillez patienter</p>
        @if(errorMessage) {
          <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p class="text-sm">{{ errorMessage }}</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuthInitComponent implements OnInit {
  errorMessage: string | null = null;

  constructor(private router: Router, private authGuard: AuthGuardService) {}

  ngOnInit(): void {
    // Ce composant ne fait plus de redirection.
    // Il vérifie simplement s'il y a une erreur à afficher.
    // La navigation est maintenant gérée par les guards de route.
    const authError = this.authGuard.getAuthError();
    if (authError === 'forbidden') {
      this.errorMessage = "Accès refusé. Vous n'avez pas les permissions nécessaires.";
    } else if (authError) {
      this.errorMessage = "Votre session a expiré ou une erreur d'authentification est survenue.";
    } else {
      // Si aucune erreur n'est stockée, on peut supposer une redirection en cours ou un accès normal.
    }
  }
}
