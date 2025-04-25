// src/app/pages/event-detail/event-detail.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EventService } from '../../services/event.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { IEvent } from '../../models/event.model';
import { IBooking } from '../../models/booking.model';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private bookingService = inject(BookingService); 
  public authService = inject(AuthService);
  private cdRef = inject(ChangeDetectorRef);

  event: IEvent | null = null;
  isLoadingEvent = true;
  eventError: string | null = null;

  bookingQuantity: number = 1;
  isBookingLoading = false;
  bookingError: string | null = null;
  bookingSuccess: string | null = null;

  ngOnInit(): void {
    this.loadEventDetails();
  }

  loadEventDetails(): void {
    this.isLoadingEvent = true;
    this.eventError = null;
    this.clearBookingStatus(); 

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.eventError = 'Invalid event ID provided in URL.';
          return of(null); 
        }
        return this.eventService.getEventById(id).pipe(
          catchError(err => {
            this.eventError = err.message || 'Failed to load event details. Please try again.';
            console.error("Error fetching event:", err);
            return of(null); 
          })
        );
      }),
      finalize(() => {
        this.isLoadingEvent = false;
        console.log('Finalize: isLoadingEvent set to false'); 
        this.cdRef.detectChanges();
      })
    ).subscribe(eventData => {
      console.log('Subscribe block entered. Event Data: ', eventData);
      this.event = eventData; 
      if (eventData) {
        this.bookingQuantity = 1;
      }
      console.log('Setting isLoadingEvent to false in subscribe.'); 
    });
  }


  bookEvent(): void {
    // guard clauses for booking logic
    if (!this.authService.isAuthenticated()) {
        this.bookingError = "You must be logged in to book tickets.";
        return;
    }
    if (!this.event) {
        this.bookingError = "Event details not available. Cannot book.";
        return;
    }
    if (this.bookingQuantity <= 0) {
        this.bookingError = "Please enter a quantity of 1 or more.";
        return;
    }
    if (this.bookingQuantity > this.event.tickets_available) {
        this.bookingError = `Only ${this.event.tickets_available} tickets are available.`;
        return;
    }

    this.isBookingLoading = true;
    this.clearBookingStatus();

    this.bookingService.createBooking(this.event!.id, this.bookingQuantity).pipe( 
      finalize(() => {
          this.isBookingLoading = false;
          this.cdRef.detectChanges(); 
      })
    ).subscribe({
       next: (createdBooking: IBooking) => {
        this.bookingSuccess = `...`;
        this.cdRef.detectChanges(); 
        setTimeout(() => this.loadEventDetails(), 100);
       },
       error: (err) => {
        this.bookingError = err.message || '...';
        this.cdRef.detectChanges(); 
       }
     });
  }

  private clearBookingStatus(): void {
    this.bookingError = null;
    this.bookingSuccess = null;
  }
}
