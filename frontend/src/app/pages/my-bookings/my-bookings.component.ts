
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { Observable, BehaviorSubject, of } from 'rxjs'; 
import { catchError, finalize } from 'rxjs/operators'; 

import { BookingService } from '../../services/booking.service';
import { IBooking } from '../../models/booking.model'; 

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
      CommonModule, 
      RouterModule  
    ],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);

  private bookingsSubject = new BehaviorSubject<IBooking[]>([]);
  public bookings$ = this.bookingsSubject.asObservable();

  isLoading = true;
  fetchError: string | null = null; 
  cancelLoadingMap = new Map<number, boolean>(); 
  cancelErrorMap = new Map<number, string>(); 

  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoading = true;
    this.fetchError = null; 
    this.cancelErrorMap.clear(); 
    this.cancelLoadingMap.clear(); 

    this.bookingService.getMyBookings().pipe(
      finalize(() => this.isLoading = false), 
      catchError(err => {
        console.error("Error fetching user bookings:", err);
        this.fetchError = err.message || 'Failed to load your bookings. Please try again later.';
        this.bookingsSubject.next([]); 
        return of([]); 
      })
    ).subscribe(bookings => {
      this.bookingsSubject.next(bookings); 
    });
  }

  cancelUserBooking(bookingId: number): void {
    if (!bookingId) {
      console.error("Invalid booking ID provided for cancellation.");
      return;
    }

    this.cancelLoadingMap.set(bookingId, true); 
    this.cancelErrorMap.delete(bookingId); 

    this.bookingService.cancelBooking(bookingId).pipe(
      finalize(() => this.cancelLoadingMap.set(bookingId, false)) 
    ).subscribe({
      next: (updatedBooking) => {
        console.log(`Booking ${bookingId} successfully cancelled.`);
        const currentBookings = this.bookingsSubject.value;
        const index = currentBookings.findIndex(b => b.id === bookingId);
        if (index > -1) {
          currentBookings[index] = updatedBooking;
          this.bookingsSubject.next([...currentBookings]);
        } else {
          this.loadMyBookings();
        }
      },
      error: (err) => {
        console.error(`Error cancelling booking ${bookingId}:`, err);
        this.cancelErrorMap.set(bookingId, err.message || `Failed to cancel booking ${bookingId}.`);
      }
    });
  }
}