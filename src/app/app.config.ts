import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authenticationInterceptor } from './core/http-interceptors/authentication.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthenticationService } from './core/authentication/authentication.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideHttpClient(
        withInterceptors([
      authenticationInterceptor,
      ]),
    ),

    provideAppInitializer(() => {
      const authenticationService = inject(AuthenticationService);

      return authenticationService.initializeSession();
    }),
  ],
};
