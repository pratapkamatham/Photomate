import { CanActivateFn } from '@angular/router';

export const photographerGuard: CanActivateFn = (route, state) => {
  return true;
};
