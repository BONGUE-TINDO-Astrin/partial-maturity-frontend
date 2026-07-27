import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthenticationService } from '../authentication/authentication.service';

/**
 * Empêche l'accès aux routes protégées lorsqu'aucune session
 * d'authentification n'existe.
 */
export const authenticationGuard: CanActivateFn = (
  _route,
  state,
) => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);

  if (authenticationService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(
    ['/login'],
    {
      queryParams: {
        returnUrl: state.url,
      },
    },
  );
};