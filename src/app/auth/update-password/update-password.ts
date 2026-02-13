import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SecurityService } from '../../services/security.service';
import { AuthService } from '../../services/auth';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css',
})
export class UpdatePassword implements OnInit {
  form: FormGroup;
  submitted = false;
  successMessage = '';
  error = '';
  loading = false;
  // L'email est séparé du reste du formulaire car il est fixe
  userEmail: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly securityService: SecurityService,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatch },
    );
  }

  ngOnInit(): void {
    // 1. On récupère l'email dès le chargement de la page
    this.userEmail = this.authService.getUserEmail();

    // Sécurité : Si pas d'email (bug session), on redirige ou on alerte
    if (!this.userEmail) {
      this.error = "Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.";
    }
  }

  private passwordsMatch(group: FormGroup) {
    const newP = group.get('newPassword')?.value;
    const confirmP = group.get('confirmPassword')?.value;
    return newP === confirmP ? null : { passwordsMismatch: true };
  }

  get f() {
    return this.form.controls;
  }

  get passwordStrength() {
    const control = this.form?.get('newPassword');
    if (!control) return 0;
    const val = control.value || '';
    return this.securityService.evaluatePasswordStrength(val);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid || !this.userEmail) return;

    this.loading = true;
    const payload = {
      ...this.form.value,
      email: this.userEmail,
    };

    this.securityService
      .updatePassword(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.successMessage =
            response.message || `Mot de passe mis à jour pour ${this.userEmail} ✅`;
          this.reset();
        },
        error: (error) => {
          this.error = 'Erreur lors de la mise à jour du mot de passe ❌';
          console.error(error);
        },
      });
  }

  reset() {
    this.form.reset();
    this.submitted = false;
    setTimeout(() => (this.successMessage = ''), 3000);
  }
}
