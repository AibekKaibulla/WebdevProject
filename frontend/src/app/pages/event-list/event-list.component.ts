import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, RouterModule } from '@angular/router'; 
import { Observable, of } from 'rxjs'; 
import { catchError, map, switchMap, tap } from 'rxjs/operators'; 

import { EventService } from '../../services/event.service'; 
import { IEvent } from '../../models/event.model'; 

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  events$: Observable<IEvent[]> | undefined;
  error: string | null = null;
  isLoading = true; 
  listTitle = 'Upcoming Events'; // default title

  ngOnInit(): void {
    this.route.data.pipe(
      tap(data => {
        const eventType = data['eventType'] as 'MOVIE' | 'CONCERT' | undefined;
        this.listTitle = eventType === 'MOVIE' ? 'Upcoming Movies' :
                         eventType === 'CONCERT' ? 'Upcoming Concerts' :
                         'All Upcoming Events'; 
        this.isLoading = true; 
        this.error = null; 
      }),
      switchMap(data => {
        const eventType = data['eventType'] as 'MOVIE' | 'CONCERT' | undefined;
        return this.eventService.getEvents(eventType).pipe(
          catchError(err => {
            console.error("Error fetching events:", err);
            this.error = err.message || 'Failed to load events. Please try again later.';
            this.isLoading = false; 
            return of([]); 
          })
        );
      })
    ).subscribe(events => {
      this.events$ = of(events); 
      this.isLoading = false; 
    });
  }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}