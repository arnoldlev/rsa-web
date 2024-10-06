import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { UserModel } from '../../core/interfaces/user.model';
import { Subscription } from 'rxjs';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {
  user: UserModel | null = null;
  isLoading: boolean = false;
  credentialsForm!: FormGroup;
  private userSubscription!: Subscription; 

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.credentialsForm = this.fb.group({
      licenseKey: [''],
      apiToken: [''],
      sandboxToken: [''],
    });

    this.userSubscription = this.userService.getUser().subscribe(user => {
      this.user = user;

      if (this.user) {
        this.credentialsForm.patchValue({
          licenseKey: this.user.licenseKey || '',
          apiToken: this.user.apiKey || '',
          sandboxToken: this.user.sandboxKey || '',
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (this.credentialsForm.valid) {
      this.isLoading = true;
      const licenseKey = this.credentialsForm.get('licenseKey')?.value;
      const apiKey = this.credentialsForm.get('apiToken')?.value;
      const sandboxKey = this.credentialsForm.get('sandboxToken')?.value;

      const user = new UserModel({
        licenseKey, apiKey, sandboxKey
      });

      this.userService.updateUser(user).subscribe({
        next: () => {
          this.isLoading = false; // Stop loading spinner
          this.notificationService.showSuccess('Successfully updated your user information!')
        },
        error: (error) => {
          this.isLoading = false; // Stop loading spinner
          console.log(error);
          this.notificationService.showError(error.error.message); 
        }
      });
    } else {
      this.notificationService.showError('Form is invalid. Please check your inputs.');
    }
  }
  
  onValidate(): void {
    const licenseKey = this.credentialsForm.get('licenseKey')?.value;
    if (licenseKey) {
      this.isLoading = true;
      this.userService.validateLicense().subscribe({
        next: (res) => {
          if (res) {
            this.notificationService.showSuccess('License Key is valid!');
          } else {
            this.notificationService.showError('License Key is not valid!');
          }
          this.isLoading = false; 
        },
        error: (error) => {
          this.isLoading = false; 
          console.log(error);
          this.notificationService.showError(error.error.message); 
        }
      });
    } else {
      this.notificationService.showError('Please provide a License Key.');
    }
  }

}
