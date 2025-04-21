import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IEvent } from '../models/event.model'; 

const API_EVENTS_URL = 'http://localhost:8000/api/events'; 

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);

  getEvents(eventType?: 'MOVIE' | 'CONCERT'): Observable<IEvent[]> {
    let params = new HttpParams();
    if (eventType) {
      params = params.set('event_type', eventType);
    }

    return this.http.get<IEvent[]>(`${API_EVENTS_URL}/`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getEventById(id: number | string): Observable<IEvent> {
    return this.http.get<IEvent>(`${API_EVENTS_URL}/${id}/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something bad happened; please try again later.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `An error occurred: ${error.error.message}`;
    } else {
      errorMessage = `Server returned code ${error.status}, error message is: ${error.message}`;
       console.error(error); 
    }
    return throwError(() => new Error(errorMessage));
  }
}