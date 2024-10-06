import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service'; // Import the new service
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterLink, ToastModule] 
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false; 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Email validation
      password: ['', Validators.required] // Password validation
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          this.isLoading = false; // Stop loading spinner
          this.userService.loadUser().subscribe();  // Load and cache user data
          this.router.navigate(['/home']); // Navigate to dashboard after successful login
        },
        error: (error) => {
          this.isLoading = false; // Stop loading spinner
          this.notificationService.showError(error.error.message); 
        }
      });
    } else {
      this.notificationService.showError('Form is invalid. Please check your inputs.');
    }
  }
}