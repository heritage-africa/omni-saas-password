import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SecurityService } from '../../services/security.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  @ViewChild('form') form!: NgForm;

  email = '';
  isLoading = false;

  // On sépare les données
  maskedEmail: string | null = null; // Contiendra "bam****@gmail.com"
  successMessage: string | null = null; // Contiendra un message texte simple (fallback)
  error = '';

  constructor(
    private readonly securityService: SecurityService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.email) return;

    // Reset des états
    this.isLoading = true;
    this.maskedEmail = null;
    this.successMessage = null;
    this.error = '';

    this.securityService.requestReset(this.email)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log("Réponse:", res);
          if (res.success === true && res.maskedEmail) {
            this.maskedEmail = res.maskedEmail;
          } else {
            // Cas rare : Succès mais sans email renvoyé
            this.successMessage = res.message || "Lien envoyé avec succès.";
          }
        },
        error: (err) => {
          console.error("Erreur:", err);
          this.error = "Une erreur technique est survenue. Veuillez réessayer.";
        },
      });
  }
}
