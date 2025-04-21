import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; 

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn      
  ): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();

  const isApiUrl = req.url.startsWith('http://localhost:8000/api'); 

  if (authToken && isApiUrl) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    return next(authReq);
  } else {
    return next(req);
  }
};