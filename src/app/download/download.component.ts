import { Component } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [NavBarComponent],
  templateUrl: './download.component.html',
  styleUrl: './download.component.scss'
})
export class DownloadComponent {

  constructor(private userService: UserService, private notificationService: NotificationService) {}

  handleDownload(platform: string): void {
    this.userService.generateDownload(platform).subscribe({
        next: (res) => {
          window.location.href = res.url;  // Redirect to download URL
          this.notificationService.showInfo('Download starting...');
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(error.error.message); 
        }
      });
  }
}
