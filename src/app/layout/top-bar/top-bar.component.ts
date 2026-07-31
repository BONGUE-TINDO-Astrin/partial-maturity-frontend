import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideChevronDown,
  LucideLogOut,
  LucideMenu,
  LucideUserRound,
} from '@lucide/angular';

import { AuthenticationService } from '../../core/authentication/authentication.service';

/**
 * Barre supérieure permanente de l'application.
 *
 * Affiche le contrôle du menu mobile,
 * l'identité de l'utilisateur et la déconnexion.
 */
@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    LucideChevronDown,
    LucideLogOut,
    LucideMenu,
    LucideUserRound,
  ],
  templateUrl: './top-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  private readonly router = inject(Router);

  readonly authenticationService = inject(AuthenticationService);

  readonly openMobileMenu = output<void>();
  readonly userMenuOpen = signal(false);
  readonly loggingOut = signal(false);

  toggleUserMenu(): void {
    if (!this.loggingOut()) {
      this.userMenuOpen.update((open) => !open);
    }
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.closeUserMenu();
    this.authenticationService.logout();

    const navigationSucceeded = await this.router.navigate(['/login']);

    if (!navigationSucceeded) {
      this.loggingOut.set(false);
    }
  }
}
