import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideCirclePlus,
  LucidePencil,
  LucidePower,
  LucideRefreshCw,
  LucideSearch,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { ApplicationUser } from '../models/application-user';
import {
  UserFormDialogComponent,
  UserFormSubmission,
} from '../user-form-dialog/user-form-dialog.component';
import { UsersService } from '../users.service';

/**
 * Écran d'administration des comptes utilisateurs.
 */
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    DatePipe,
    UserFormDialogComponent,
    LucideCircleAlert,
    LucideCircleCheckBig,
    LucideCirclePlus,
    LucidePencil,
    LucidePower,
    LucideRefreshCw,
    LucideSearch,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<ApplicationUser[]>([]);
  readonly searchTerm = signal('');

  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly pageError = signal<string | null>(null);
  readonly dialogError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly dialogOpen = signal(false);
  readonly selectedUser = signal<ApplicationUser | null>(null);
  readonly statusConfirmationUser = signal<ApplicationUser | null>(null);

  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.users();
    }

    return this.users().filter(
      (user) =>
        user.username.toLowerCase().includes(search) ||
        user.fullName.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search),
    );
  });

  readonly activeUsersCount = computed(
    () => this.users().filter((user) => user.active).length,
  );

  readonly adminCount = computed(
    () =>
      this.users().filter(
        (user) => user.role === 'ADMIN' && user.active,
      ).length,
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.pageError.set(null);

    this.usersService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: (error: HttpErrorResponse) => {
          this.pageError.set(this.resolveErrorMessage(error));
        },
      });
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateDialog(): void {
    if (this.submitting()) {
      return;
    }

    this.successMessage.set(null);
    this.dialogError.set(null);
    this.selectedUser.set(null);
    this.dialogOpen.set(true);
  }

  openEditDialog(user: ApplicationUser): void {
    if (this.submitting()) {
      return;
    }

    this.successMessage.set(null);
    this.dialogError.set(null);
    this.selectedUser.set(user);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (!this.submitting()) {
      this.resetDialog();
    }
  }

  saveUser(submission: UserFormSubmission): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.dialogError.set(null);
    this.successMessage.set(null);

    if (submission.mode === 'create' && submission.createRequest) {
      this.usersService
        .create(submission.createRequest)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (createdUser) => {
            this.users.update((users) =>
              [...users, createdUser].sort((first, second) =>
                first.fullName.localeCompare(second.fullName, 'fr'),
              ),
            );
            this.resetDialog();
            this.successMessage.set(
              `Le compte ${createdUser.username} a été créé.`,
            );
          },
          error: (error: HttpErrorResponse) => {
            this.dialogError.set(this.resolveErrorMessage(error));
          },
        });
      return;
    }

    const user = this.selectedUser();

    if (submission.mode === 'edit' && submission.updateRequest && user) {
      this.usersService
        .update(user.id, submission.updateRequest)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (updatedUser) => {
            this.replaceUser(updatedUser);
            this.resetDialog();
            this.successMessage.set(
              `Le compte ${updatedUser.username} a été modifié.`,
            );
          },
          error: (error: HttpErrorResponse) => {
            this.dialogError.set(this.resolveErrorMessage(error));
          },
        });
      return;
    }

    this.submitting.set(false);
  }

  requestStatusChange(user: ApplicationUser): void {
    if (this.submitting()) {
      return;
    }

    this.successMessage.set(null);
    this.pageError.set(null);
    this.statusConfirmationUser.set(user);
  }

  cancelStatusChange(): void {
    if (!this.submitting()) {
      this.statusConfirmationUser.set(null);
    }
  }

  confirmStatusChange(): void {
    const user = this.statusConfirmationUser();

    if (!user || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.pageError.set(null);

    this.usersService
      .changeStatus(user.id, { active: !user.active })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (updatedUser) => {
          this.replaceUser(updatedUser);
          this.statusConfirmationUser.set(null);
          this.successMessage.set(
            updatedUser.active
              ? `Le compte ${updatedUser.username} a été activé.`
              : `Le compte ${updatedUser.username} a été désactivé.`,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.statusConfirmationUser.set(null);
          this.pageError.set(this.resolveErrorMessage(error));
        },
      });
  }

  private resetDialog(): void {
    this.dialogOpen.set(false);
    this.selectedUser.set(null);
    this.dialogError.set(null);
  }

  private replaceUser(updatedUser: ApplicationUser): void {
    this.users.update((users) =>
      users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user,
      ),
    );
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    let body: unknown = error.error;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    const apiError = body as ApiErrorResponse | null;

    if (apiError?.message) {
      return apiError.message;
    }

    return error.status === 0
      ? 'Le serveur est actuellement inaccessible.'
      : 'Une erreur est survenue pendant le traitement.';
  }
}
