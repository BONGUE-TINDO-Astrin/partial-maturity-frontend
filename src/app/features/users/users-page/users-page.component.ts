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
  LucideCirclePlus,
  LucidePencil,
  LucidePower,
  LucideRefreshCw,
  LucideSearch,
  LucideUsers,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { ApplicationUser } from '../models/application-user';
import { UserFormDialogComponent, UserFormSubmission } from '../user-form-dialog/user-form-dialog.component';
import { UsersService } from '../users.service';

/**
 * Écran d'administration des comptes utilisateurs.
 *
 * Responsabilités :
 * - charger et filtrer la liste ;
 * - ouvrir le formulaire de création/modification ;
 * - demander confirmation avant un changement de statut ;
 * - présenter clairement les erreurs du backend.
 */
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    DatePipe,
    UserFormDialogComponent,
    LucideCirclePlus,
    LucidePencil,
    LucidePower,
    LucideRefreshCw,
    LucideSearch,
    LucideUsers,
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

  readonly statusConfirmationUser =
    signal<ApplicationUser | null>(null);

  readonly filteredUsers = computed(() => {
    const normalizedSearch =
      this.searchTerm().trim().toLowerCase();

    if (!normalizedSearch) {
      return this.users();
    }

    return this.users().filter((user) => {
      return (
        user.username
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.role
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  });

  readonly activeUsersCount = computed(
    () =>
      this.users().filter((user) => user.active).length,
  );

  readonly adminCount = computed(
    () =>
      this.users().filter(
        (user) =>
          user.role === 'ADMIN' &&
          user.active,
      ).length,
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.pageError.set(null);

    this.usersService
      .getAll()
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateDialog(): void {
    this.successMessage.set(null);
    this.dialogError.set(null);
    this.selectedUser.set(null);
    this.dialogOpen.set(true);
  }

  openEditDialog(user: ApplicationUser): void {
    this.successMessage.set(null);
    this.dialogError.set(null);
    this.selectedUser.set(user);
    this.dialogOpen.set(true);
  }

    /**
    * Fermeture demandée manuellement par l'utilisateur.
    */
    closeDialog(): void {
        if (this.submitting()) {
    return;
    }
        this.resetDialog();
    }

    
    /**
    * Fermeture interne après une opération réussie.
    */
    private resetDialog(): void {
        this.dialogOpen.set(false);
        this.selectedUser.set(null);
        this.dialogError.set(null);
    }

    /**
     * Crée ou modifie un utilisateur selon le mode
     * transmis par le formulaire.
     */
    saveUser(submission: UserFormSubmission): void {
    this.submitting.set(true);
    this.dialogError.set(null);
    this.successMessage.set(null);

    if (
        submission.mode === 'create' &&
        submission.createRequest
    ) {
        this.usersService
        .create(submission.createRequest)
        .pipe(
            finalize(() => this.submitting.set(false)),
        )
        .subscribe({
            next: (createdUser) => {
            this.users.update((users) =>
                [...users, createdUser].sort(
                (first, second) =>
                    first.fullName.localeCompare(
                    second.fullName,
                    'fr',
                    ),
                ),
            );

            /*
            * Le bloc next est exécuté avant finalize.
            * submitting est donc encore à true ici.
            */
            this.resetDialog();

            this.successMessage.set(
                `Le compte ${createdUser.username} a été créé.`,
            );
            },

            error: (error: HttpErrorResponse) => {
            /*
            * En cas d'erreur, le formulaire reste ouvert
            * afin que l'utilisateur puisse corriger les données.
            */
            this.dialogError.set(
                this.resolveErrorMessage(error),
            );
            },
        });

        return;
    }

    const selectedUser = this.selectedUser();

    if (
        submission.mode === 'edit' &&
        submission.updateRequest &&
        selectedUser
    ) {
        this.usersService
        .update(
            selectedUser.id,
            submission.updateRequest,
        )
        .pipe(
            finalize(() => this.submitting.set(false)),
        )
        .subscribe({
            next: (updatedUser) => {
            this.replaceUser(updatedUser);
            this.resetDialog();

            this.successMessage.set(
                `Le compte ${updatedUser.username} a été modifié.`,
            );
            },

            error: (error: HttpErrorResponse) => {
            this.dialogError.set(
                this.resolveErrorMessage(error),
            );
            },
        });

        return;
    }

    /*
    * Protection si la soumission reçue ne correspond
    * à aucun des deux modes attendus.
    */
    this.submitting.set(false);
    }

  requestStatusChange(user: ApplicationUser): void {
    this.successMessage.set(null);
    this.pageError.set(null);
    this.statusConfirmationUser.set(user);
  }

  cancelStatusChange(): void {
    if (this.submitting()) {
      return;
    }

    this.statusConfirmationUser.set(null);
  }

  confirmStatusChange(): void {
    const user = this.statusConfirmationUser();

    if (!user) {
      return;
    }

    this.submitting.set(true);
    this.pageError.set(null);

    this.usersService
      .changeStatus(
        user.id,
        {
          active: !user.active,
        },
      )
      .pipe(
        finalize(() => this.submitting.set(false)),
      )
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

          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  private replaceUser(
    updatedUser: ApplicationUser,
  ): void {
    this.users.update((users) =>
      users.map((user) =>
        user.id === updatedUser.id
          ? updatedUser
          : user,
      ),
    );
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const apiError =
      error.error as ApiErrorResponse | null;

    if (apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'Le serveur est actuellement inaccessible.';
    }

    return 'Une erreur est survenue pendant le traitement.';
  }
}