// account.model.ts
export interface Account {
    account_number: string;
    classification: string;
    date_created: string;      
    day_trader: boolean;
    option_level: number;
    status: string;
    type: string;
    last_update_date: string;  
  }
  
 
  export interface Profile {
    id: string;
    name: string;
    account: Account[];        
  }
  
  export interface ProfileResponse {
    profile: Profile;
  }
  