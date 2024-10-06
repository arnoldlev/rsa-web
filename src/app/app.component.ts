import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { NavBarComponent } from './nav-bar/nav-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, ToastModule, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'rsa-web';

  constructor(private router: Router) {}

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
