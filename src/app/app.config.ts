import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from '../core/auth/auth.interceptor';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { routes } from './app.routes';
import { AuthGuard } from '../core/auth/auth.guard';
import { RoleGuard } from '../core/auth/role.guard';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    JwtHelperService,
    AuthGuard, 
    RoleGuard,
    MessageService,
    provideHttpClient(withInterceptorsFromDi()),
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS }, provideAnimationsAsync()
  ]
};
