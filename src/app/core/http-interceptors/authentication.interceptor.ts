import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthenticationService } from '../authentication/authentication.service';

/**
 * Ajoute automatiquement le JWT aux appels HTTP.
 *
 * Une réponse 401 entraîne le nettoyage de la session et
 * une redirection vers la page de connexion.
 */
export const authenticationInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const accessToken = authenticationService.getAccessToken();

  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
        if (
            error.status === 401 &&
            !request.url.endsWith('/auth/login')
            ) {
            authenticationService.logout();

            if (!request.url.endsWith('/auth/me')) {
                void router.navigate(['/login'], {
                queryParams: {
                    sessionExpired: true,
                },
                });
            }
        }

      return throwError(() => error);
    }),
  );
};