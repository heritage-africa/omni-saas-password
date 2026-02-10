import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SecurityService } from '../../services/security.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  @ViewChild('form') form!: NgForm;

  token = '';
  form_data = {
    newPassword: '',
    confirmPassword: '',
  };

  isLoading = false;
  message = '';
  error = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly securityService: SecurityService,
  ) {}

  ngOnInit(): void {
    // 1. Récupérer le token dans l'URL (?token=...)
    this.token = this.route.snapshot.queryParams['token'];

    if (!this.token) {
      this.error = 'Lien invalide ou incomplet (Token manquant).';
    }
  }

  onSubmit() {
    // Validation locale simple
    if (this.form_data.newPassword !== this.form_data.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Appel au Backend
    this.securityService
      .submitReset(this.token, this.form_data.newPassword, this.form_data.confirmPassword)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.message = 'Mot de passe modifié avec succès !';
          // Redirection automatique vers Nextcloud après 3 secondes
          setTimeout(() => {
            globalThis.location.href = 'https://accounts.omail.africa';
          }, 3000);
        },
        error: (err) => {
          this.isLoading = false;
          // Affiche l'erreur précise du Backend (ex: "Lien expiré")
          this.error = err.error?.error || 'Le lien a expiré ou est invalide.';
        },
      });
  }
}
