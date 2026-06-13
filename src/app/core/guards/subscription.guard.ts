import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = () => {
  const authService         = inject(AuthService);
  const subscriptionService = inject(SubscriptionService);
  const router              = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        router.navigate(['/login']);
        return of(false);
      }

      return subscriptionService.getMySubscription().pipe(
        map(subscription => {
          if (!subscription) {
            router.navigate(['/expired']);
            return false;
          }

          const { status } = subscriptionService.getTrialStatus(subscription);
          if (status === 'expired') {
            router.navigate(['/expired']);
            return false;
          }

          return true;
        })
      );
    })
  );
};