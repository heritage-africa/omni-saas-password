import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SecurityService } from '../../services/security.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  @ViewChild('form') form!: NgForm;

  email = '';
  isLoading = false;
  message = '';
  error = '';

  constructor(private readonly securityService: SecurityService) {}

  onSubmit() {
    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.securityService.requestReset(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Affiche le message de succès retourné par Java
        this.message = res.message;
      },
      error: (err) => {
        this.isLoading = false;
        // En cas d'erreur réseau ou serveur
        this.error = 'Une erreur technique est survenue. Veuillez réessayer plus tard.';
      },
    });
  }
}
