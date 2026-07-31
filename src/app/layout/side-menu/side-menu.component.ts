import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
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
 * La visibilité des liens améliore l'expérience utilisateur.
 * La sécurité définitive reste appliquée par le backend.
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
  readonly authenticationService = inject(AuthenticationService);

  readonly mobileOpen = input(false);
  readonly closeMobileMenu = output<void>();

  close(): void {
    if (this.mobileOpen()) {
      this.closeMobileMenu.emit();
    }
  }
}
