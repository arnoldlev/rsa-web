import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { NgIf } from '@angular/common';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user.interface';
import { UserModel } from '../../core/interfaces/user.model';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TradeService } from '../../core/services/trade.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf, NavBarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  user: UserModel | null = null;
  private userSubscription!: Subscription; 

  constructor(private userService: UserService, private tradeService: TradeService) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getUser().subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
}