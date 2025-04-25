// src/app/services/booking.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IBooking } from '../models/booking.model';

const API_BOOKINGS_URL = 'http://localhost:8000/api/bookings'; 

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);

  createBooking(eventId: number, quantity: number): Observable<IBooking> {
    const payload = {
      event_id: eventId,
      quantity: quantity
    };
    return this.http.post<IBooking>(`${API_BOOKINGS_URL}/`, payload)
      .pipe(
        catchError(this.handleError) 
      );
  }

  getMyBookings(): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(`${API_BOOKINGS_URL}/mine/`)
      .pipe(
        catchError(this.handleError) 
      );
  }

  getBookingById(bookingId: number | string): Observable<IBooking> {
    return this.http.get<IBooking>(`${API_BOOKINGS_URL}/${bookingId}/`)
      .pipe(
        catchError(this.handleError) 
      );
  }


  cancelBooking(bookingId: number | string): Observable<IBooking> {
    return this.http.patch<IBooking>(`${API_BOOKINGS_URL}/${bookingId}/cancel/`, {})
      .pipe(
        catchError(this.handleError) 
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred during the booking operation.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code.
      console.error(
        `Booking Service Error: Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`);

      if (error.error && typeof error.error === 'object' && error.error.detail) {
          errorMessage = error.error.detail;
      } else if (error.error && typeof error.error === 'object') {
          try {
            errorMessage = Object.entries(error.error).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
          } catch(e) {
            errorMessage = `Booking operation failed (Server status: ${error.status})`;
          }
      } else if (typeof error.error === 'string' && error.error.length > 0) {
         errorMessage = error.error;
      } else {
        errorMessage = `Booking operation failed (Server status: ${error.status})`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}