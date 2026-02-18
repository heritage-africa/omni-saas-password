import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  errorMessage = '';
  loading = false;
  currentUserEmail = '';

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {

      // --- STRATÉGIE 1 : COOKIE NEXTCLOUD (LA MEILLEURE) ---
      // On récupère "bambandour" depuis le cookie nc_username
      const ncUsername = this.getCookie('nc_username');

      if (ncUsername) {
        // On reconstruit l'email : bambandour + @omail.africa
        // Note: decodeURIComponent gère les caractères spéciaux si besoin
        this.currentUserEmail = `${decodeURIComponent(ncUsername)}@omail.africa`;
        console.log("Utilisateur détecté via Cookie Nextcloud:", this.currentUserEmail);
      }

      // --- STRATÉGIE 2 : PARAMÈTRE URL (BACKUP) ---
      // Si on a passé ?email=... dans l'URL
      else if (this.route.snapshot.queryParams['email']) {
        this.currentUserEmail = this.route.snapshot.queryParams['email'];
      }

      // --- STRATÉGIE 3 : LOCALSTORAGE (FALLBACK) ---
      else {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
             const user = JSON.parse(storedUser);
             this.currentUserEmail = user.email || '';
          } catch(e) {}
        }
      }

      // INITIALISATION DU FORMULAIRE
      if (this.currentUserEmail) {
        this.form.patchValue({ email: this.currentUserEmail });
      }

      // SÉCURITÉ
      if (this.currentUserEmail && !this.currentUserEmail.endsWith('@omail.africa')) {
        this.errorMessage = "Attention : Ce formulaire est réservé exclusivement aux comptes @omail.africa";
        this.form.disable();
      }
    }
  }

  /**
   * Méthode utilitaire pour lire un cookie par son nom
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // ... (Le reste : passwordsMatch, onSubmit, getters... ne change pas) ...
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
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.currentUserEmail.endsWith('@omail.africa')) {
      this.errorMessage = "Modification impossible : Domaine non autorisé.";
      return;
    }

    if (this.form.invalid) return;

    this.loading = true;
    const payload = this.form.getRawValue();

    this.securityService.updatePassword(payload).subscribe({
      next: (response) => {
        this.loading = false;
        const currentDate = new Date().toLocaleString();
        this.successMessage = response.message || `Mot de passe mis à jour avec succès le ${currentDate}`;
        this.form.patchValue({ oldPassword: '', newPassword: '', confirmPassword: '' });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.submitted = false;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Erreur technique lors de la mise à jour.';
      }
    });
  }

  reset() {
    this.form.reset({ email: this.currentUserEmail });
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
