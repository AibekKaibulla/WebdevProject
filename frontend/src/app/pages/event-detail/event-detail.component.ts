// src/app/pages/event-detail/event-detail.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../services/event.service';
import { BookingService } from '../../services/Booking.Service'; 
import { IEvent } from '../../models/event.model';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private bookingService = inject(BookingService); 

  event: IEvent | null = null;
  isLoading = true;
  error: string | null = null;
  isAlreadyBooked = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.error = 'Invalid event ID';
          return of(null);
        }
        return this.eventService.getEventById(id).pipe(
          catchError(err => {
            this.error = err.message || 'Failed to load event details';
            return of(null);
          })
        );
      })
    )
    
    .subscribe(event => {
      this.event = event;
      if (event) {
        this.isAlreadyBooked = this.bookingService.isBooked(event.id); 
      }
      this.isLoading = false;
    });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  bookEvent(): void {
    if (this.event && this.event.tickets_available > 0 && !this.isAlreadyBooked) {
      this.bookingService.addBooking(this.event);
      this.isAlreadyBooked = true;
    }
  }
}
