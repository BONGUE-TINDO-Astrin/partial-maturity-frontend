import { DecimalPipe, NgStyle } from '@angular/common';
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
  LucideArchiveX,
  LucideCalendarDays,
  LucideCircleCheckBig,
  LucideCircleX,
  LucideCoins,
  LucideFileClock,
  LucideFiles,
  LucideLandmark,
  LucidePercent,
  LucideReceiptText,
  LucideRefreshCw,
  LucideTrendingUp,
  LucideWalletCards,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { ImportBatchStatus } from '../../imports/models/import-batch-status';
import { DashboardService } from '../dashboard.service';
import { DashboardResponse } from '../models/dashboard-response';
import { MonthlyPaymentStatistic } from '../models/monthly-payment-statistic';

/**
 * Tableau de bord financier commun.
 *
 * Le backend fournit toutes les valeurs financières.
 * Le composant réalise uniquement des transformations
 * de présentation pour les graphiques HTML/CSS natifs.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DecimalPipe,
    NgStyle,
    LocalDatePipe,
    RouterLink,
    LucideArchiveX,
    LucideCalendarDays,
    LucideCircleCheckBig,
    LucideCircleX,
    LucideCoins,
    LucideFileClock,
    LucideFiles,
    LucideLandmark,
    LucidePercent,
    LucideReceiptText,
    LucideRefreshCw,
    LucideTrendingUp,
    LucideWalletCards,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly dashboard = signal<DashboardResponse | null>(null);

  readonly loading = signal(false);

  readonly pageError =  signal<string | null>(null);

  /**
   * Plus grand montant mensuel utilisé uniquement
   * pour normaliser la hauteur des barres.
   *
   * Les montants financiers ne sont pas recalculés.
   */
  readonly maximumMonthlyPaidAmount = computed(
    () => {
      const payments =
        this.dashboard()?.monthlyPayments ?? [];

      return payments.reduce(
        (maximum, statistic) =>
          Math.max(
            maximum,
            statistic.paidAmount,
          ),
        0,
      );
    },
  );

  /**
   * Style du graphique en anneau.
   *
   * La valeur paidPercentage est déjà calculée
   * et sécurisée par le backend.
   */
  readonly interestDonutStyle = computed(
    () => {
      const paidPercentage =
        this.dashboard()
          ?.interestDistribution
          .paidPercentage ?? 0;

      const safePercentage =
        Math.min(
          Math.max(paidPercentage, 0),
          100,
        );

      return {
        background:
          `conic-gradient(` +
          `var(--color-belife-success) 0% ${safePercentage}%, ` +
          `var(--color-belife-accent) ${safePercentage}% 100%)`,
      };
    },
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Recharge l'ensemble du dashboard
   * en un seul appel HTTP.
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
            resolveApiErrorMessage(
              error,
              'Le tableau de bord ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  /**
   * Retourne une hauteur comprise entre 0 et 100 %.
   *
   * Une petite hauteur minimale permet aux mois ayant
   * un montant positif très faible de rester visibles.
   */
  paymentBarHeight(statistic: MonthlyPaymentStatistic): number {
    const maximum =
      this.maximumMonthlyPaidAmount();

    if (
      maximum <= 0 ||
      statistic.paidAmount <= 0
    ) {
      return 0;
    }

    const percentage =
      (
        statistic.paidAmount /
        maximum
      ) * 100;

    return Math.max(
      Math.min(percentage, 100),
      4,
    );
  }

  /**
   * Transforme yyyy-MM en libellé français court.
   *
   * La construction en UTC évite un décalage de mois
   * lié au fuseau du navigateur.
   */
  monthLabel(month: string): string {
    const [yearText, monthText] =
      month.split('-');

    const year = Number(yearText);
    const monthNumber = Number(monthText);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return month;
    }

    const date = new Date(
      Date.UTC(
        year,
        monthNumber - 1,
        1,
      ),
    );

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        month: 'short',
      },
    )
      .format(date)
      .replace('.', '');
  }

  /**
   * Libellé plus complet utilisé dans les infobulles
   * et les informations accessibles.
   */
  fullMonthLabel(month: string): string {
    const [yearText, monthText] =
      month.split('-');

    const year = Number(yearText);
    const monthNumber = Number(monthText);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return month;
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      },
    ).format(
      new Date(
        Date.UTC(
          year,
          monthNumber - 1,
          1,
        ),
      ),
    );
  }

  importStatusLabel(status: ImportBatchStatus): string {
    const labels: Record<
      ImportBatchStatus,
      string
    > = {
      PROCESSING: 'En cours',
      IMPORTED: 'Importé',
      REJECTED: 'Rejeté',
      REVERSED: 'Annulé',
    };

    return labels[status];
  }

  /**
   * Formate un instant technique récent.
   */
  formatInstant(instant: string): string {
    const date = new Date(instant);

    if (Number.isNaN(date.getTime())) {
      return instant;
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(date);
  }
}