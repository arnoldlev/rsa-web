import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { AbstractControl, FormBuilder,FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service'; 

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  resetForm!: FormGroup;
  isLoading: boolean = false; 
  showReset: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required]],
      repeatPassword: ['', [Validators.required]],
      confirmationCode: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  sendResetEmail(): void {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      const email = this.forgotForm.get('email')?.value;
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.notificationService.showSuccess('Please check your email for reset code.');
          this.showReset = true;
          this.isLoading = false;
          this.forgotForm.disable();
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to send reset email.'); 
          this.isLoading = false; 
        }
      });
    }
  }

  onResetPassword(): void {
    if (this.resetForm.valid) {
      const email = this.forgotForm.get('email')?.value;
      const code = this.resetForm.get('confirmationCode')?.value;
      const pass = this.resetForm.get('newPassword')?.value;
      
      this.isLoading = true;
      this.authService.confirmForgotPassword(email, pass, code).subscribe({
        next: () => {
          this.notificationService.showSuccess('Please check your email for reset code.');
          this.showReset = false;
          this.isLoading = false;
          this.router.navigate(['/login']); 
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to reset password.'); 
          this.isLoading = false;
        }
      });
    }
  }

  passwordsMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const repeatPassword = control.get('repeatPassword');
    
    // If the password fields do not match, return a mismatch error
    if (newPassword && repeatPassword && newPassword.value !== repeatPassword.value) {
      return { mismatch: true };
    }

    return null;
  }

}
