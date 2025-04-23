import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs'; 
import { AuthService } from '../services/auth.service'; 

export const authGuard: CanActivateFn = (route, state):
  | boolean
  | UrlTree
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree> => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // user is logged in, allow access to the route
    return true;
  } else {
    // user is not logged in, redirect to the login page
    console.log('AuthGuard: User not authenticated, redirecting to login.');
    const urlTree: UrlTree = router.createUrlTree(['/login']);
    return urlTree;
  }
};