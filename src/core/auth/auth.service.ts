import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ROLE_KEY = 'user_roles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5089/auth' //'https://api.rsabot.com/auth'; // Your backend API URL
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(localStorage.getItem(TOKEN_KEY));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    this.currentUserSubject.next(accessToken); // Update the current access token
  }

  // Check if the access token is expired and refresh if necessary
  public isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token || !this.isTokenValid(token)) {
      this.refreshToken().subscribe({
        next: (response: any) => {
          if (response)
            this.storeTokens(response.accessToken, response.refreshToken);
        },
        error: () => {
          this.logout();
        }
      });
      return false; // Waiting for refresh
    }
    return true;
  }

  // Login
  login(email: string, password: string) {
    return this.http.post<any>(`${this.baseUrl}/signin`, { email, password }, { headers: this.addHeader() })
      .pipe(map(response => {
        if (response && response.accessToken) {
          this.storeTokens(response.accessToken, response.refreshToken);
        }
        return response;
      }));
  }

  // Signup
  signup(username: string, password: string, email: string) {
    return this.http.post<any>(`${this.baseUrl}/signup`, { username, password, email }, { headers: this.addHeader() });
  }

  confirmSignup(email: string, confirmationCode: string) {
    return this.http.post<any>(`${this.baseUrl}/confirm-signup`, { email, confirmationCode }, { headers: this.addHeader() });
  }

  forgotPassword(email: string) {
    return this.http.post<any>(`${this.baseUrl}/forgot-password`, { email }, { headers: this.addHeader() });
  }

  confirmForgotPassword(email: string, newPassword: string, confirmationCode: string) {
    return this.http.post<any>(`${this.baseUrl}/confirm-forgot-password`, { email, confirmationCode, newPassword }, { headers: this.addHeader() });
  }

  // Refresh the access token using the refresh token
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return of(null);
    }

    return this.http.post<any>(`${this.baseUrl}/refresh-token`, { refreshToken }, { headers: this.addHeader() })
      .pipe(
        map(response => {
          if (response && response.accessToken) {
            this.storeTokens(response.accessToken, response.refreshToken);
          }
          return response;
        }),
        catchError((error) => {
          this.logout();
          console.error(error);
          return of(null);
        })
      );
  }

  // Logout
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Get roles from token
  getRoles(): string[] {
    const token = localStorage.getItem(TOKEN_KEY);
    const decodedToken = this.jwtHelper.decodeToken(token || '');
    return decodedToken?.roles || [];
  }

  getSubId(): string {
    const token = localStorage.getItem(TOKEN_KEY);
    const decodedToken = this.jwtHelper.decodeToken(token || '');
    return decodedToken?.sub || [];
  }

  isTokenValid(token: string): boolean {
    try {
      // Decode the token to check its validity
      const decodedToken = this.jwtHelper.decodeToken(token);

      // If the token is decoded successfully and is not expired, return true
      if (decodedToken && !this.jwtHelper.isTokenExpired(token)) {
        return true;
      }
    } catch (error) {
      // If the token is invalid or an error occurs during decoding, return false
      return false;
    }

    return false;
  }

  private addHeader() {
    return new HttpHeaders({
        'Custom-Service': 'Auth',
        'Accept': 'application/json'
    });
}
}
