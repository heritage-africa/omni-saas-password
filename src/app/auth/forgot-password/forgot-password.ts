import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SecurityService } from '../../services/security.service';
import { finalize } from 'rxjs';

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

    this.securityService
      .requestReset(this.email)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.message = res.message;
        },
        error: (err) => {
          this.error = 'Une erreur technique est survenue. Veuillez réessayer plus tard.';
        },
      });
  }
}
