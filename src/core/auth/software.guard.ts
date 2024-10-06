import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoftwareGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private userService: UserService,private notificationService: NotificationService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (this.authService.isAuthenticated()) {
        return this.userService.validateLicense().pipe(
            map((res) => {
              if (res) {
                return true;
              } else {
                this.notificationService.showError('License Key is not valid!');
                return false;
              }
            }),
            catchError((error) => {
              console.log(error);
              this.notificationService.showError(error.error.message);
              return of(false); 
            })
          );
    } else {
        return of(false);
    }
  }
}
