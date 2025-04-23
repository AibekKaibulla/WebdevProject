import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { HomeComponent } from './pages/home/home.component';
import { EventListComponent } from './pages/event-list/event-list.component';
import { EventDetailComponent } from './pages/event-detail/event-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
    { path: '', component: HomeComponent }, 
  { path: 'home', component: HomeComponent },
  {
    path: 'movies',
    component: EventListComponent,
    data: { eventType: 'MOVIE' } 
  },
  {
    path: 'concerts',
    component: EventListComponent,
    data: { eventType: 'CONCERT' } 
  },
  { path: 'events/:id', component: EventDetailComponent }, 
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [authGuard] }, 

  { path: '**', component: NotFoundComponent }
];
