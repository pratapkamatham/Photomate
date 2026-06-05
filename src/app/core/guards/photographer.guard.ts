import { inject, Injectable } from '@angular/core';
import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
 
export const photographerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserRole().pipe(
    take(1),
    map(role => {
      if (role === 'photographer') {
        return true;
      }
      router.navigate(['/auth/login']);
      return false;
    })
  );
};