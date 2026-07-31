import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavigationPathComponent } from '../navigation-path/navigation-path.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

/**
 * Coque principale des pages authentifiées.
 *
 * Assemble le menu latéral, la barre supérieure,
 * le chemin de navigation et la zone fonctionnelle.
 */
@Component({
  selector: 'app-application-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationPathComponent,
    SideMenuComponent,
    TopBarComponent,
  ],
  templateUrl: './application-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationShellComponent {
  readonly mobileMenuOpen = signal(false);

  openMobileMenu(): void {
    if (!this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(true);
    }
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }
}
