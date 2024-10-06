import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserModel } from '../interfaces/user.model';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../interfaces/user.interface';

const USER_KEY = 'user_profile';

@Injectable({
  providedIn: 'root',
})
export class UserService {
    private baseUrl = 'https://api.rsabot.com/auth'; 
    private licenseURL = 'https://api.rsabot.com' 
    private userSubject: BehaviorSubject<UserModel | null> = new BehaviorSubject<UserModel | null>(null);

    constructor( private http: HttpClient, private authService: AuthService) {
        this.loadUserFromLocalStorage();
    }

  // Check if user is in localStorage and update the BehaviorSubject accordingly
  private loadUserFromLocalStorage(): void {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      const user = new UserModel(JSON.parse(storedUser));
      this.userSubject.next(user);  // Set the current value of the subject to the stored user
    }
  }

  // Load the user data from the API if not already loaded
  loadUser(): Observable<UserModel> {
    if (this.userSubject.value) {
        // Return the BehaviorSubject as an Observable but filter out `null` values
        return this.userSubject.asObservable().pipe(
          filter(user => user !== null) as any  // Ensures we only emit non-null values
        );
      }

    const sub = this.authService.getSubId();  // Get the user sub or ID
    return this.http.get<UserModel>(`${this.baseUrl}/user/${sub}`)
      .pipe(
        map(response => new UserModel(response)),  // Transform response into UserModel
        tap(userModel => {
          this.userSubject.next(userModel);  // Update the BehaviorSubject with the new user data
          localStorage.setItem(USER_KEY, JSON.stringify(userModel));  // Cache user in localStorage
        })
      );
  }

  getUser(): Observable<UserModel> {
    return this.userSubject.asObservable().pipe(
      filter(user => user !== null) as any  // Filter out `null` values
    );
  }


  clearUser(): void {
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);  
  }

  generateDownload(target: string) : Observable<any> {
    return this.http.get<any>(`${this.licenseURL}/download/generate-url/${target}`).pipe(
        map(response => response),
        catchError((error) => {
            console.error('Error getting download link', error);
            return of(null);  
        })
    );
  }
      
    validateLicense(): Observable<boolean> {
        var user = localStorage.getItem(USER_KEY) || '';
        var model = new UserModel(JSON.parse(user));
        return this.http.get<any>(`${this.licenseURL}/validateLicense?key=${model.licenseKey}`)
          .pipe(
            map(response => response.isValid),  
            catchError((error) => {
              console.error('Error validating license', error);
              return of(false);  
            })
        );
    }
      
    updateUser(model: User): Observable<boolean> {
        const sub = this.authService.getSubId();
        return this.http.post<boolean>(`${this.baseUrl}/user/${sub}`, {
          licenseKey: model.licenseKey,
          sandboxKey: model.sandboxKey,
          apiKey: model.apiKey
        }).pipe(
          tap(response => {
            if (response) {
              const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
              const updatedUser = {
                ...storedUser,  // Keep other fields unchanged
                licenseKey: model.licenseKey,
                sandboxKey: model.sandboxKey,
                apiKey: model.apiKey
              };

              localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
              this.userSubject.next(updatedUser);
            }
          }),
          map(response => response)  // Just pass the boolean response to the caller
        );
    }

}