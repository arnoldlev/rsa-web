import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service'; // Import the new service

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [FormsModule, NgIf, RouterLink] // Importing necessary modules for standalone component
})
export class SignupComponent {
  username = '';
  password = '';
  email = '';

  constructor(private authService: AuthService, private router: Router,
    private notificationService: NotificationService) {}

  signup() {
    this.authService.signup(this.username, this.password, this.email).pipe(
      tap(response => {
        // On successful signup, navigate to confirm
        this.router.navigate(['/confirm-signup']);
        this.notificationService.showInfo('Check your email for a verification code!');
      }),
      catchError(error => {
        // Handle error and show message
        console.log(error);
        this.notificationService.showError(error.error);
        return of(null); 
      })
    ).subscribe();
  }
}
