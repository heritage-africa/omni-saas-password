import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SecurityService } from '../../services/security.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css',
})
export class UpdatePassword {
  form: FormGroup;
  submitted = false;
  successMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private securityService: SecurityService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: FormGroup | any) {
    const newP = group.get('newPassword')?.value;
    const confirmP = group.get('confirmPassword')?.value;
    return newP === confirmP ? null : { passwordsMismatch: true };
  }

  get f() { return this.form.controls; }

  get passwordStrength() {
    const control = this.form?.get('newPassword');
    if (!control) return 0;
    const val = control.value || '';
    return this.securityService.evaluatePasswordStrength(val);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    const payload = this.form.value;

    this.securityService.updatePassword(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || `Mot de passe mis à jour pour ${payload.email} ✅`;
        this.reset();
      },
      error: (error) => {
        this.loading = false;
        this.successMessage = 'Erreur lors de la mise à jour du mot de passe ❌';
        console.error(error);
      }
    });
  }

  reset() {
    this.form.reset();
    this.submitted = false;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
