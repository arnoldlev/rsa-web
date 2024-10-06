export interface Quote {
    symbol: string;
    description: string;
    exch: string;
    type: string;
    last: number | null;
    change: number | null;
    volume: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    bid: number | null;
    ask: number | null;
    change_percentage: number | null;
    average_volume: number | null;
    last_volume: number | null;
    trade_date: number | null;
    prevclose: number | null;
    week_52_high: number | null;
    week_52_low: number | null;
    bidsize: number | null;
    bidexch: string;
    bid_date: number | null;
  }
  
  export interface QuotesResponse {
    quotes: {
       quote: Quote | Quote[];
    };
  }
  