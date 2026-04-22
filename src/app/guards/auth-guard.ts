import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check the signal we created in the AuthService
  if (authService.isLoggedIn()) {
    return true; // Access granted!
  } else {
    // Access denied, redirect to the login page
    router.navigate(['/login']);
    return false;
  }
};
