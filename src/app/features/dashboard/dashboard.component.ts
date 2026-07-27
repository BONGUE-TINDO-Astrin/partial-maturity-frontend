import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { AuthenticationService } from '../../core/authentication/authentication.service';
import { LucideCircleCheck, LucideShieldCheck, LucideUserRound } from '@lucide/angular';

/**
 * Tableau de bord temporaire du Sprint 1.
 *
 * Ce composant permet de vérifier la connexion,
 * l'utilisateur courant, son rôle et la déconnexion.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideCircleCheck, LucideShieldCheck, LucideUserRound,],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly authenticationService = inject(AuthenticationService);
}