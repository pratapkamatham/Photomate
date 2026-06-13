import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const affiliateGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUserRole().pipe(
    take(1),
    map(role => {
      if (role === 'affiliate') return true;
      router.navigate(['/login']);
      return false;
    })
  );
};

