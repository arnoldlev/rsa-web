import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private userService: UserService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const serviceType = request.headers.get('Custom-Service');
  
    if (serviceType === 'Auth') {
      return next.handle(request);  // Handle auth-specific requests
    } 
  
    if (serviceType === 'ApiTradier') {
      return this.handleHeaderRequest(request, 'apiKey', next);
    } 
    
    if (serviceType === 'SandboxTradier') {
      return this.handleHeaderRequest(request, 'sandboxKey', next);
    }
  
    // Handle requests without a specific service type
    let authToken = this.authService.getAccessToken();
    let authReq = this.addTokenHeader(request, authToken);
  
    return next.handle(authReq).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        console.error('Error:', error);
        return throwError(() => error);  // Propagate original error
      })
    );
  }
  
  // Helper function to add the Authorization header for specific services
  private handleHeaderRequest(request: HttpRequest<any>, keyType: 'apiKey' | 'sandboxKey', next: HttpHandler): Observable<HttpEvent<any>> {
    return this.userService.getUser().pipe(
      switchMap(user => {
        const apiKey = keyType === 'apiKey' ? user.apiKey : user.sandboxKey;
        const modifiedRequest = request.clone({
          headers: request.headers.set('Authorization', `Bearer ${apiKey}`).delete('Custom-Service') 
        });
        return next.handle(modifiedRequest);
      }),
      catchError(error => {
        console.error('Error handling request:', error);
        return throwError(() => error);  // Propagate original error
      })
    );
  }
  
  // Helper function to add the Authorization header with a token
  private addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (token) {
      return request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    return request;
  }
  
}
