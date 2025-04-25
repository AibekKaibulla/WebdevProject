import { IUser } from "./user.model";
import { IEvent } from "./event.model";
import { ITicket } from "./ticket.model";

export interface IBooking {
  id: number;
  booking_time: string; 
  status: 'CONFIRMED' | 'CANCELLED'; 
  status_display: string; 

  user: IUser;     
  event: IEvent;   
  tickets: ITicket[]; 
}