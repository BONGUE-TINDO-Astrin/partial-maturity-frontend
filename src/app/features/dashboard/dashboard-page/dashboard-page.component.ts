import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarDays,
  LucideCircleCheckBig,
  LucideCircleX,
  LucideCoins,
  LucideFiles,
  LucideReceiptText,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideUsers,
  LucideWalletCards,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { AuditEventType } from '../../audit/models/audit-event-type';
import { DashboardService } from '../dashboard.service';
import { DashboardResponse } from '../models/dashboard-response';

/**
 * Tableau de bord principal de l'application.
 *
 * Le contenu affiché dépend du rôle retourné
 * par le backend :
 *
 * - ADMIN consulte les utilisateurs, imports et audits ;
 * - COMPTABILITE consulte le portefeuille et les paiements.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    LucideCalendarDays,
    LucideCircleCheckBig,
    LucideCircleX,
    LucideCoins,
    LucideFiles,
    LucideReceiptText,
    LucideRefreshCw,
    LucideShieldCheck,
    LucideUsers,
    LucideWalletCards,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService =
    inject(DashboardService);

  readonly dashboard =
    signal<DashboardResponse | null>(null);

  readonly loading = signal(false);

  readonly pageError =
    signal<string | null>(null);

  readonly isAdminDashboard = computed(
    () => this.dashboard()?.role === 'ADMIN',
  );

  readonly isAccountingDashboard = computed(
    () =>
      this.dashboard()?.role ===
      'COMPTABILITE',
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Recharge tous les indicateurs autorisés
   * pour l'utilisateur connecté.
   */
  loadDashboard(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.pageError.set(null);

    this.dashboardService
      .getDashboard()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  /**
   * Retourne un libellé français
   * pour un événement d'audit.
   */
  auditEventLabel(
    eventType: AuditEventType,
  ): string {
    const labels: Record<
      AuditEventType,
      string
    > = {
      USER_CREATED: 'Utilisateur créé',
      USER_UPDATED: 'Utilisateur modifié',
      USER_ACTIVATED: 'Utilisateur activé',
      USER_DEACTIVATED:
        'Utilisateur désactivé',
      FILE_IMPORTED: 'Fichier importé',
      FILE_REJECTED: 'Fichier rejeté',
      PAYMENT_RECORDED:
        'Paiement enregistré',
      PAYMENT_CANCELLED:
        'Paiement annulé',
    };

    return labels[eventType];
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    let responseBody: unknown = error.error;

    if (typeof responseBody === 'string') {
      try {
        responseBody =
          JSON.parse(responseBody);
      } catch {
        responseBody = null;
      }
    }

    const apiError =
      responseBody as ApiErrorResponse | null;

    if (apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'Le serveur est actuellement inaccessible.';
    }

    return 'Le tableau de bord ne peut pas être chargé.';
  }
}