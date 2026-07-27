import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthenticationService } from '../authentication/authentication.service';
import { UserRole } from '../authentication/models/user-role';

/**
 * Vérifie que l'utilisateur possède le rôle défini
 * dans les données de la route.
 *
 * Exemple :
 *
 * data: {
 *   roles: ['ADMIN']
 * }
 */
export const roleGuard: CanActivateFn = (
  route,
) => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);

  const allowedRoles =
    (route.data['roles'] as UserRole[] | undefined) ?? [];

  if (
    allowedRoles.length === 0 ||
    allowedRoles.some(
      (role) => authenticationService.hasRole(role),
    )
  ) {
    return true;
  }

  return router.createUrlTree(['/app/access-denied']);
};