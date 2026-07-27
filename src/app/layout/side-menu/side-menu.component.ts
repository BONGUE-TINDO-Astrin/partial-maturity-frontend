import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive, } from '@angular/router';
import {
  LucideClipboardList,
  LucideCreditCard,
  LucideFileUp,
  LucideLayoutDashboard,
  LucideSearch,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { AuthenticationService } from '../../core/authentication/authentication.service';

/**
 * Menu principal de l'application.
 *
 * Les liens présentés dépendent du rôle de l'utilisateur.
 * Cette visibilité ne remplace pas la sécurité du backend.
 */
@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideClipboardList,
    LucideCreditCard,
    LucideFileUp,
    LucideLayoutDashboard,
    LucideSearch,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './side-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuComponent {
  readonly authenticationService =
    inject(AuthenticationService);

  /**
   * Détermine si le menu mobile est visible.
   */
  readonly mobileOpen = input(false);

  /**
   * Demande au composant parent de fermer le menu mobile.
   */
  readonly closeMobileMenu = output<void>();

  close(): void {
    this.closeMobileMenu.emit();
  }
}