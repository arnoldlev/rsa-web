import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { UserService } from '../../core/services/user.service';
import { TradeService } from '../../core/services/trade.service';
import { catchError, combineLatest, concat, concatMap,  EMPTY, finalize, from, map, mergeMap, Observable, of, Subject, Subscription, switchMap, take, takeUntil, tap, toArray } from 'rxjs';
import { UserModel } from '../../core/interfaces/user.model';
import { Profile } from '../../core/interfaces/account.model';
import { FormBuilder, FormControl,  FormGroup,  FormsModule,  ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { Balances } from '../../core/interfaces/balance.model';
import { Quote } from '../../core/interfaces/quote.model';
import { Error } from '../../core/interfaces/error.model';
import { OrderStatus } from '../../core/interfaces/order.model';
import { Position } from '../../core/interfaces/position.model';

@Component({
  selector: 'app-software',
  standalone: true,
  imports: [CommonModule, NavBarComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './software.component.html',
  styleUrl: './software.component.scss'
})
export class SoftwareComponent implements OnInit {
  user: UserModel | null = null;
  profile: Profile | null = null;
  balances: Balances[] = [];
  positions: Position[] = [];

  quote$!: Observable<Quote | null>;

  private userSubscription!: Subscription; 
  private tradeSubscripton!: Subscription;

  quoteSearchForm!: FormGroup;
  purchaseForm!: FormGroup;
  selectedOption: string = 'Buy';

  service$: any;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private tradeService: TradeService, private fb: FormBuilder
    ,private messageService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getUser().subscribe(user => {
      this.user = user;
    });

   this.service$ = this.tradeService.getProfile('https://api.tradier.com/v1/')
    .pipe(
      switchMap(profile => {
        if (!profile || !profile.account || profile.account.length === 0) {
          this.messageService.showError('Unable to load Profile. Check API Key')
          console.warn('Profile is null or has no accounts');
          return EMPTY;  
        }
        
        this.profile = profile;
        const balanceCalls = profile.account.map(account => {
          return this.tradeService.getBalances('https://api.tradier.com/v1', account.account_number)
        });

        return combineLatest(balanceCalls).pipe(
          map(balances => {
            return { profile, balances };
          })
        );
      }),
      switchMap(({ profile, balances }) => {
        this.balances = balances;
        const positionCalls = profile.account.map(account =>
          this.tradeService.getPositions('https://api.tradier.com/v1', account.account_number)
        );
  
        return combineLatest(positionCalls);
      }),
      map(positions => {
        const allPositions = positions.flat();
        this.positions = allPositions;
        return allPositions;
      })
    );
    
    this.tradeSubscripton = this.service$.subscribe({
      next: () => {
        console.log('Profile:', this.profile);
        console.log('Stocks', this.positions);
        console.log('Balances', this.balances);
      },
      error: (err: any) => {
        console.error('An error occurred:', err);
      },
      complete: () => {
        console.log('All API calls completed successfully.');
      }
    });

    this.quoteSearchForm = this.fb.group({
      symbol: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.purchaseForm = this.fb.group({
      symbol: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      action: ['', [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.tradeService) {
      this.tradeSubscripton.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete(); 
  }

  get totalEquity() : number {
    var total = 0;
    this.balances.forEach(e => {
      total += e.total_equity;
    });
    return Math.round(total);
  }

  searchQuote() {
    if (this.quoteSearchForm.valid && this.symbol) {
      console.log('Searching for:', this.quoteSearchForm.value.symbol);
      this.quote$ = this.tradeService.getQuotes('https://api.tradier.com/v1', this.quoteSearchForm.value.symbol);
    } else {
      this.messageService.showError('You must enter a valid symbol.');
    }
  }

  purchase2() {
    if (this.purchaseForm.valid) {
      const stock : Position = {
        symbol: this.purchaseForm.value.symbol,
        quantity: this.purchaseForm.value.quantity
      }
      
      const accountNumbers = this.profile?.account.map(acc => acc.account_number) || [];

      from(accountNumbers).pipe(
        concatMap(accountNumber => {
          return this.tradeService.placeOrder('https://api.tradier.com/v1', accountNumber, this.purchaseForm.value.action, stock)
            .pipe(
              take(1),
              tap(res => {
                if ('error' in res) {
                  const errorResponse = res as Error;
                  this.messageService.showError(`Order failed for account ${accountNumber}: ${errorResponse.error[0]}`);
                  return errorResponse;
                } else {
                  const status = res as OrderStatus;
                  this.messageService.showSuccess(`Tap: Order placed for account ${accountNumber}: ${status.status.toUpperCase()}`);
                  return status;
                }
              }),
              catchError(error => {
                console.error(`Tap: Order failed for account ${accountNumber}`, error);
                this.messageService.showError(`Order failed for account ${accountNumber}: Internal Server Error`);
                return of({ error: [`Failed to process positions for account ${accountNumber}`] } as Error);
              }),
              finalize(() => {
                console.log(`(Trade Finalize): Completed purchase2 for account ${accountNumber}`);
              })
            );
        })
      ).subscribe({
        next: res => {
          console.log('Next: Sequential order processing complete:', res);
        },
        error: err => {
          console.error('An error occurred during the sequential order placement:', err);
          this.messageService.showError('An error occurred while placing orders.');
        },
        complete: () => {
          console.log('All positions fetched and processed.');
        }
      });
    }
  }

  sellAll() {
    const url = 'https://api.tradier.com/v1';
    
    if (!this.profile?.account || this.profile.account.length === 0) {
      console.warn('No accounts available to sell positions for.');
      return;
    }

    const accountNumbers = this.profile.account.map(acc => acc.account_number);

    from(accountNumbers)
      .pipe(
        concatMap(accountNumber => {
          console.log(`Merge: Selling all positions for account ${accountNumber}`);
          return this.tradeService.sellAllPositions(url, accountNumber).pipe(
            take(1),
            map(res => {
              // If no results were returned, ensure that you still emit an empty array or error object
              if (!res || res.length === 0) {
                return [{ error: [`No positions were sold for account ${accountNumber}`] } as Error];
              }
              return res;
            }),
            catchError(err => {
              console.warn(`Error selling positions for account ${accountNumber}`, err);
              return of({ error: [`Failed to sell positions for account ${accountNumber}`] } as Error); 
            })
          );
        }),
        toArray(),
    )
    .subscribe({
      next: (results) => {
        console.log('All sell operations completed:', results);
        const successfulOrders = results.flat().filter(result => 'status' in result).length;
        const failedOrders = results.flat().filter(result => 'error' in result).length;
        this.messageService.showInfo(`Successful Orders ${successfulOrders} | Failed Orders ${failedOrders}\nCheck console logs for details`);
      },
      error: (err) => {
        console.error('An error occurred while fetching positions:', err);
      },
      complete: () => {
        console.log('All positions fetched and processed.');
      }
    });  
  }

  get symbol() {
    return this.quoteSearchForm.get('symbol');
  }

  get purchaseSymbol() {
    return this.purchaseForm.get('symbol');
  }

  get quantity() {
    return this.purchaseForm.get('quantity');
  }

  get price() {
    return this.purchaseForm.get('price');
  }

}
