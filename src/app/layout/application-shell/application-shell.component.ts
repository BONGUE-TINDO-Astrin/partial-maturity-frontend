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
 * Ce composant assemble le menu latéral,
 * la barre supérieure, le chemin de navigation
 * et la zone d'affichage des fonctionnalités.
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
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}