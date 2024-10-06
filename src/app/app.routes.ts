import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from '../core/auth/auth.guard';
import { SignupComponent } from './signup/signup.component';
import { ConfirmSignupComponent } from './confirm-signup/confirm-signup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PublicAuthGuard } from '../core/auth/public-guard.guard';
import { AccountComponent } from './account/account.component';
import { DownloadComponent } from './download/download.component';
import { SoftwareComponent } from './software/software.component';
import { SoftwareGuard } from '../core/auth/software.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'confirm-signup', component: ConfirmSignupComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },

    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },
    { path: 'download', component: DownloadComponent, canActivate: [AuthGuard] },
    { path: 'software', component: SoftwareComponent, canActivate: [AuthGuard, SoftwareGuard] },

    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
