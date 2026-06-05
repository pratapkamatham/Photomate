 
import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';


export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserRole().pipe(
    take(1),
    map(role => {
      if (role === 'super-admin') {
        return true;
      }
      router.navigate(['/dashboard']); 
      return false;
    })
  );
};
