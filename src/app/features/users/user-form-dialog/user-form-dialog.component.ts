import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideEye,
  LucideEyeOff,
  LucideX,
} from '@lucide/angular';

import { UserRole } from '../../../core/authentication/models/user-role';
import { ApplicationUser } from '../models/application-user';
import { CreateUserRequest } from '../models/create-user-request';
import { UpdateUserRequest } from '../models/update-user-request';

export interface UserFormSubmission {
  mode: 'create' | 'edit';
  createRequest?: CreateUserRequest;
  updateRequest?: UpdateUserRequest;
}

/**
 * Fenêtre de création et modification d'un utilisateur.
 * Le composant ne réalise aucun appel HTTP.
 */
@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideEye,
    LucideEyeOff,
    LucideX,
  ],
  templateUrl: './user-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly user = input<ApplicationUser | null>(null);
  readonly submitting = input(false);
  readonly serverError = input<string | null>(null);

  readonly closeDialog = output<void>();
  readonly saveUser = output<UserFormSubmission>();

  readonly isEditMode = computed(() => this.user() !== null);
  readonly title = computed(() =>
    this.isEditMode()
      ? 'Modifier l’utilisateur'
      : 'Créer un utilisateur',
  );

  readonly roles: readonly UserRole[] = [
    'ADMIN',
    'COMPTABILITE',
  ];

  readonly showPassword = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
      ],
    ],
    fullName: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
      ],
    ],
    role: [
      'COMPTABILITE' as UserRole,
      [Validators.required],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(200),
      ],
    ],
  });

  constructor() {
    effect(() => {
      const selectedUser = this.user();
      this.showPassword.set(false);

      if (!selectedUser) {
        this.form.reset({
          username: '',
          fullName: '',
          role: 'COMPTABILITE',
          password: '',
        });

        this.form.controls.username.enable({
          emitEvent: false,
        });

        this.form.controls.password.setValidators([
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(200),
        ]);
      } else {
        this.form.reset({
          username: selectedUser.username,
          fullName: selectedUser.fullName,
          role: selectedUser.role,
          password: '',
        });

        this.form.controls.username.disable({
          emitEvent: false,
        });
        this.form.controls.password.clearValidators();
      }

      this.form.controls.password.updateValueAndValidity({
        emitEvent: false,
      });
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  cancel(): void {
    if (!this.submitting()) {
      this.closeDialog.emit();
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedUser = this.user();
    const rawValue = this.form.getRawValue();

    if (selectedUser) {
      this.saveUser.emit({
        mode: 'edit',
        updateRequest: {
          fullName: rawValue.fullName.trim(),
          role: rawValue.role,
        },
      });
      return;
    }

    this.saveUser.emit({
      mode: 'create',
      createRequest: {
        username: rawValue.username.trim().toLowerCase(),
        fullName: rawValue.fullName.trim(),
        role: rawValue.role,
        password: rawValue.password,
      },
    });
  }
}
