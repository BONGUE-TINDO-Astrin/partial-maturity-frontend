import { inject } from '@angular/core';
import { CanActivateFn, Router, } from '@angular/router';

import { AuthenticationService } from '../authentication/authentication.service';

/**
 * Réserve une route aux utilisateurs non authentifiés.
 *
 * Exemple : un utilisateur connecté qui ouvre /login
 * est redirigé vers le tableau de bord.
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authenticationService = inject(AuthenticationService);

  const router = inject(Router);

  if (!authenticationService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([
    '/app/dashboard',
  ]);
};