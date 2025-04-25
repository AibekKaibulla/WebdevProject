export interface ITicket {
    id: number;         
    event: number;        
    booking: number;      
    ticket_code: string;  // The unique UUID string (e.g., "a1b2c3d4-e5f6...")
    price_paid: string;   
    seat_info: string | null; 
    issued_at: string;    
  }