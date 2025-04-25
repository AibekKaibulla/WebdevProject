import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; 

function addTokenHeader(request: HttpRequest<unknown>, token: string) {
  return request.clone({
      setHeaders: {
          Authorization: `Bearer ${token}`
      }
  });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();
  const isApiUrl = req.url.startsWith('http://localhost:8000/api'); 

  if (authToken && isApiUrl) {
      req = addTokenHeader(req, authToken);
  }

  return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && isApiUrl && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
              return handle401Error(req, next, authService);
          }

          return throwError(() => error); 
      })
  );
};


let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService 
): Observable<HttpEvent<unknown>> {

  if (isRefreshing) {
      return refreshTokenSubject.pipe(
          filter(token => token != null), 
          take(1), 
          switchMap((newAccessToken) => {
              return next(addTokenHeader(request, newAccessToken!));
          }),
          catchError((err) => {
              authService.logout();
              return throwError(() => err);
          })
      );
  } else {
      isRefreshing = true;
      refreshTokenSubject.next(null); 

      return authService.refreshToken().pipe(
          switchMap((tokenResponse: { access: string }) => {
              isRefreshing = false;
              refreshTokenSubject.next(tokenResponse.access);
              return next(addTokenHeader(request, tokenResponse.access));
          }),
          catchError((error) => {
              isRefreshing = false;
              authService.logout(); 
              refreshTokenSubject.error(error); 
              return throwError(() => error); 
          })
      );
  }
}