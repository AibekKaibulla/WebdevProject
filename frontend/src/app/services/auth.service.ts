import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, tap, catchError, map } from 'rxjs';

import { ITokenResponse } from '../models/token.model'; 
import { IUser } from '../models/user.model'; 
import { ILoginCredentials, IRegisterPayload } from '../models/auth.model'; 

const API_BASE_URL = 'http://localhost:8000/api/auth';

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  public get currentUserValue(): IUser | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserValue && !!this.getAccessToken();
  }

  public getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) { 
        return localStorage.getItem('access_token');
    }
    return null; 
 }

  login(credentials: ILoginCredentials): Observable<ITokenResponse> {
    return this.http.post<ITokenResponse>(`${API_BASE_URL}/login/`, credentials)
      .pipe(
        tap(response => {
          this.saveAuthentication(response);
        }),
        catchError(this.handleError) 
      );
  }

  register(payload: IRegisterPayload): Observable<IUser> { 
    return this.http.post<IUser>(`${API_BASE_URL}/register/`, payload)
      .pipe(
        catchError(this.handleError) 
      );
  }

  logout(): void {

    this.clearAuthentication(); 
    this.router.navigate(['/login']); 
  }

  refreshToken(): Observable<{ access: string }> {
    let refreshToken: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
        refreshToken = localStorage.getItem('refresh_token');
    }

    if (!refreshToken) {
      if (isPlatformBrowser(this.platformId)) {
          this.router.navigate(['/login']); 
      }
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<{ access: string }>(`${API_BASE_URL}/refresh/`, { refresh: refreshToken })
      .pipe(
         tap((response: { access: string }) => {
             if (isPlatformBrowser(this.platformId)) { 
                 localStorage.setItem('access_token', response.access);
                 console.log('Access token refreshed');
             }
         }),
         catchError(error => {
             if (isPlatformBrowser(this.platformId)) { 
                 this.clearAuthentication();
                 this.router.navigate(['/login']);
             }
             return this.handleError(error);
         })
      );
}

  private saveAuthentication(response: ITokenResponse): void {
    if (isPlatformBrowser(this.platformId)) { 
        if (response.access && response.refresh && response.user) {
            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);
            localStorage.setItem('current_user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            console.log('Authentication saved.');
        } else {
            console.error('Incomplete token response received:', response);
            this.clearAuthentication();
        }
    } else {
         if (response.user) this.currentUserSubject.next(response.user);
    }
}
private clearAuthentication(): void {
  if (isPlatformBrowser(this.platformId)) { 
     localStorage.removeItem('access_token');
     localStorage.removeItem('refresh_token');
     localStorage.removeItem('current_user');
     this.currentUserSubject.next(null); 
     console.log('Authentication cleared.');
  } else {
      this.currentUserSubject.next(null); 
  }
}


  private getUserFromStorage(): IUser | null {
    if (isPlatformBrowser(this.platformId)) { // <-- check if in browser
        const userJson = localStorage.getItem('current_user');
        try {
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
            this.clearAuthentication(); 
            return null;
        }
    } else {
        return null;
    }
}


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`);
      errorMessage = error.error?.detail || error.message || `Server error ${error.status}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}