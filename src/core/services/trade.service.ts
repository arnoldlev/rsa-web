import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserModel } from '../interfaces/user.model';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, concatMap, delay, filter, finalize, map, mergeMap, startWith, switchMap, take, tap, toArray } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, from, merge, Observable, of, throwError } from 'rxjs';
import { Quote, QuotesResponse } from '../interfaces/quote.model';
import { Profile, ProfileResponse } from '../interfaces/account.model';
import { Balances } from '../interfaces/balance.model';
import { Position } from '../interfaces/position.model';
import { OrderStatus } from '../interfaces/order.model';
import { Error } from '../interfaces/error.model';


@Injectable({
    providedIn: 'root',
  })
export class TradeService {
    private rateLimitDelay: number = 0;
  
    constructor( private http: HttpClient, private authService: AuthService) {
    }

    public getProfile(url: string) : Observable<Profile | null> {
        return this.http.get<ProfileResponse>(`${url}/user/profile`, { headers: this.addHeader(url), observe: 'response' })
        .pipe(
          delay(this.rateLimitDelay),
          map((response: HttpResponse<ProfileResponse>) => {
            this.handleRateLimiting(response.headers);
            const profile = response.body?.profile;              
            if (profile && !Array.isArray(profile.account)) {
              profile.account = [profile.account];  
            }
            return profile!;
          }),
          catchError(err => {
            console.error('Error fetching profile:', err);
            return of(null);
          })
        );
    }

    public getPositions(url: string, accNumber: string) : Observable<Position[]> {
      return this.http.get<any>(`${url}/accounts/${accNumber}/positions`, {headers: this.addHeader(url), observe: 'response'}).pipe(
        delay(this.rateLimitDelay),
        map((response) => {
          this.handleRateLimiting(response.headers);
          const pos = response.body?.positions;              
          if (pos && pos.position && !Array.isArray(pos.position)) {
            pos.position = [pos.position];  
          }
          return (pos?.position) ? pos.position : [];
        }),
        catchError(err => {
          console.error(err);
          return of([]);
        })
      );
    }

    public getBalances(url: string, accNumber: string) : Observable<Balances> {
      return this.http.get<any>(`${url}/accounts/${accNumber}/balances`, {headers: this.addHeader(url), observe: 'response'}).pipe(
        delay(this.rateLimitDelay),
        map((response) => {
          this.handleRateLimiting(response.headers);
          return response.body?.balances;
        }),
        catchError(err => {
          console.error(err);
          return EMPTY;
        })
      );
    }

    public getQuotes(url: string, symbol: string) : Observable<Quote | null> {
        return this.http.get<any>(`${url}/markets/quotes?symbols=${symbol}`, {headers: this.addHeader(url), observe: 'response'}).pipe(
            delay(this.rateLimitDelay),
            map((response) => {
                this.handleRateLimiting(response.headers);
                return (Array.isArray(response.body.quotes.quote)) ? response.body.quotes.quote[0] : response.body.quotes.quote
            }),
            catchError(err => {
                console.log(err);
                return of(null);
            })
        );
    }

    public placeOrder(url: string, accNumber: string, action: string, stock: Position) : Observable<OrderStatus | Error> {
      const data = {
        account_id: accNumber,
        class: "equity",
        symbol: stock.symbol,
        side: action,
        quantity: stock.quantity,
        type: "market",
        duration: "day"
      };

      return this.http.post<any>(`${url}/accounts/${accNumber}/orders`, this.encodeURL(data), {headers: this.addHeader(url), observe: 'response'}).pipe(
        delay(this.rateLimitDelay),
        map((response) => {
          this.handleRateLimiting(response.headers);
          if (response.body?.errors) {
            return response.body?.errors as Error;
          }
          return response.body?.order as OrderStatus;
        }),
        catchError((err) => {
          console.warn(err);
          const errorResponse: Error = {
            error: err.message || 'Unknown error occurred'
          };
          return of(errorResponse);
        })
      );
    }

    sellAllPositions(url: string, accountNumber: string): Observable<(OrderStatus | Error)[]> {
      return this.getPositions(url, accountNumber).pipe(
        tap(positions => {
          console.log(`(Trade Tap): Positions for account ${accountNumber}:`, positions);
        }),
        concatMap(positions => {
          // Check if there are no positions
          if (positions.length === 0) {
            console.warn(`(Trade Concat): No positions to sell for account ${accountNumber}`);
            return of([{ error: [`No positions to sell for account ${accountNumber}`] } as Error]);
          }
          // Proceed with selling positions
          return from(positions).pipe(
            concatMap(position => {
              console.log(`(Trade Concat): Selling position ${position.symbol} for account ${accountNumber}`);
              return this.placeOrder(url, accountNumber, 'sell', position).pipe(
                take(1),
                tap(result => console.log(`(Trade Tap): Order result for ${position.symbol}:`, result)),
                map((result) => result as OrderStatus | Error), 
                catchError(err => {
                  console.warn(`(Trade Error): Error selling ${position.symbol} for account ${accountNumber}`, err);
                  return of({ error: [`Failed to sell ${position.symbol}`] } as Error);
                }),
                finalize(() => {
                  console.log(`(Trade Finalize): Completed order for ${position.symbol}`);
                })
              );
            }),
            toArray(),  
            //map(results => results as (OrderStatus | Error)[])  
          );
        }),
        catchError(err => {
          console.error(`(Trade Error): Error occurred in sellAllPositions for account ${accountNumber}:`, err);
          return of([{ error: [`Failed to fetch positions for account ${accountNumber}`] } as Error]);
        }),
        finalize(() => {
          console.log(`(Trade Finalize): Completed sellAllPositions for account ${accountNumber}`);
        })
      );
    }
    

    private encodeURL(data: any) : string {
      const urlEncodedData = new URLSearchParams();

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          urlEncodedData.append(key, data[key].toString());
        }
      }
      return urlEncodedData.toString();
    }

    private addHeader(url: string) {
        return new HttpHeaders({
            'Custom-Service': (url.search('sandbox') !== -1) ? 'SandboxTradier' : 'ApiTradier'
        });
    }

    private handleRateLimiting(headers: HttpHeaders): void {
        const available = headers.get('X-ratelimit-available');
        const expiry = headers.get('X-ratelimit-expiry');
    
        if (available && Number(available) === 0 && expiry) {
          const delayMs = Number(expiry) * 1000;  // Convert expiry to milliseconds
          console.warn(`Rate limit reached. Delaying for ${delayMs} milliseconds.`);
          this.rateLimitDelay = delayMs;  
        } else {
          this.rateLimitDelay = 0;  // Reset delay if no limit
        }
      }

}
  