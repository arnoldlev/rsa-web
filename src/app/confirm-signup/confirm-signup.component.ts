import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder,FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service'; 

@Component({
  selector: 'app-confirm-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './confirm-signup.component.html',
  styleUrl: './confirm-signup.component.scss'
})
export class ConfirmSignupComponent implements OnInit {
  confirmForm!: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.confirmForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      confirmationCode: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.confirmForm.valid) {
      const email = this.confirmForm.get('email')?.value;
      const confirmationCode = this.confirmForm.get('confirmationCode')?.value;

      this.authService.confirmSignup(email, confirmationCode).subscribe({
        next: () => {
          this.router.navigate(['/login']); // Redirect to login after successful confirmation
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to confirm sign-up.'); 
        }
      });
    }
  }
}