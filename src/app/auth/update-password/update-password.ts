import { Component, OnInit } from '@angular/core';
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
export class UpdatePassword implements OnInit {
  form: FormGroup;
  submitted = false;
  successMessage = '';
  error = '';
  loading = false;
  // L'email est séparé du reste du formulaire car il est fixe
  userEmail: string = '';

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService
  ) {
    this.form = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }


  ngOnInit(): void {

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
    if (this.form.invalid || !this.userEmail) return;

    this.loading = true;
    const payload = {
      ...this.form.value,
      email: this.userEmail
    };

    this.securityService.updatePassword(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || `Mot de passe mis à jour pour ${this.userEmail} ✅`;
        this.reset();
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Erreur lors de la mise à jour du mot de passe ❌';
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
