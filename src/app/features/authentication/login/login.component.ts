import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators,} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink,} from '@angular/router';
import { finalize } from 'rxjs';

import { AuthenticationService } from '../../../core/authentication/authentication.service';

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

/**
 * Écran d'authentification de l'application.
 *
 * Le composant gère uniquement le formulaire et les états visuels.
 * La gestion de la session est déléguée à AuthenticationService.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService =
    inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sessionExpired = computed(
    () =>
      this.activatedRoute.snapshot.queryParamMap.get(
        'sessionExpired',
      ) === 'true',
  );

  readonly loginForm = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
      ],
    ],
  });

  /**
   * Envoie les identifiants au backend et redirige
   * l'utilisateur après une connexion réussie.
   */
    submit(): void {
        this.errorMessage.set(null);

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);

        const request = this.loginForm.getRawValue();

        this.authenticationService
            .login(request)
            .pipe(
            finalize(() => this.isSubmitting.set(false)),
            )
            .subscribe({
            next: async () => {
                const requestedReturnUrl =
                this.activatedRoute.snapshot.queryParamMap.get(
                    'returnUrl',
                );

                const targetUrl =
                requestedReturnUrl &&
                requestedReturnUrl.startsWith('/app/')
                    ? requestedReturnUrl
                    : '/app/dashboard';

                const navigationSucceeded = await this.router.navigateByUrl(targetUrl);

                if (!navigationSucceeded) {
                this.errorMessage.set(
                    'La connexion a réussi, mais la page d’accueil n’a pas pu être ouverte.',
                );
                }
            },

            error: (error: HttpErrorResponse) => {
                this.errorMessage.set(
                this.resolveErrorMessage(error),
                );
            },
        });
    }

  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const apiError =
      error.error as ApiErrorResponse | null;

    if (
      error.status === 401 &&
      apiError?.message
    ) {
      return apiError.message;
    }

    if (error.status === 403 && apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'Le serveur est actuellement inaccessible.';
    }

    return 'Une erreur est survenue pendant la connexion.';
  }


}