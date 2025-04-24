// src/app/pages/my-bookings/my-bookings.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../services/Booking.Service';
import { IEvent } from '../../models/event.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookedEvents: IEvent[] = [];

  ngOnInit(): void {
    this.bookedEvents = this.bookingService.getBookings();
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}