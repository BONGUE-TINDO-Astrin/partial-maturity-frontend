import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  LucideCircleAlert,
  LucideLockKeyhole,
  LucideLogIn,
  LucideTriangleAlert,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';

/**
 * Écran d'authentification de l'application.
 * La gestion de la session est déléguée à AuthenticationService.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideCircleAlert,
    LucideLockKeyhole,
    LucideLogIn,
    LucideTriangleAlert,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sessionExpired = computed(
    () =>
      this.activatedRoute.snapshot.queryParamMap.get('sessionExpired') ===
      'true',
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

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authenticationService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: async () => {
          const requestedReturnUrl =
            this.activatedRoute.snapshot.queryParamMap.get('returnUrl');

          const targetUrl =
            requestedReturnUrl?.startsWith('/app/')
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
            resolveApiErrorMessage(
              error,
              'Une erreur est survenue pendant la connexion.',
            ),
          );
        },
      });
  }
}
