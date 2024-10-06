import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  constructor(private router: Router, private authService: AuthService, private userService: UserService) {}

  async signOut() {
    try {
        this.authService.logout(); 
        this.userService.clearUser();
      this.router.navigate(['/']); // Redirect to homepage after sign out
    } catch (error) {
      console.log('Error signing out: ', error);
    }
  }
}
