export interface IEvent {
    id: number;
    name: string;
    description: string;
    event_type: 'CONCERT' | 'MOVIE' | 'OTHER'; 
    event_type_display: string; // added by serializer
    date_time: string; 
    venue_name: string;
    address: string;
    ticket_price: string; 
    total_capacity: number;
    tickets_sold: number; 
    tickets_available: number; 
    created_at: string;
    updated_at: string;
  }