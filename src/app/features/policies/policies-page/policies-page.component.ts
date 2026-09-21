import { DecimalPipe } from '@angular/common';
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
  LucideEye,
  LucideFileSearch,
  LucideLandmark,
  LucideRefreshCw,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import {
  finalize,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { PaymentConfirmationDialogComponent } from '../../../shared/ui-components/payment-confirmation-dialog.component/payment-confirmation-dialog.component';
import { PaymentResponse } from '../../payments/models/payment-response';
import { PaymentsService } from '../../payments/payments.service';
import { PolicyFinancialDetail } from '../models/policy-financial-detail';
import { PolicyFinancialSummary } from '../models/policy-financial-summary';
import { PolicyPaymentHistory } from '../models/policy-payment-history';
import { PoliciesService } from '../policies.service';
import { PolicyFinancialDetailDialogComponent } from '../policy-financial-detail-dialog/policy-financial-detail-dialog.component';

/**
 * Liste les polices et leur situation financière courante.
 *
 * Les données sont chargées à l'ouverture. La recherche
 * est ensuite appliquée localement au numéro de police
 * et au nom du client.
 */
@Component({
  selector: 'app-policies-page',
  standalone: true,
  imports: [
    DecimalPipe,
    LocalDatePipe,
    PaymentConfirmationDialogComponent,
    PolicyFinancialDetailDialogComponent,
    LucideEye,
    LucideFileSearch,
    LucideLandmark,
    LucideRefreshCw,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './policies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesPageComponent implements OnInit {
  readonly authenticationService =
    inject(AuthenticationService);

  private readonly policiesService =
    inject(PoliciesService);

  private readonly paymentsService =
    inject(PaymentsService);

  readonly policies =
    signal<PolicyFinancialSummary[]>([]);

  readonly searchTerm = signal('');

  readonly selectedDetail =
    signal<PolicyFinancialDetail | null>(null);

  readonly selectedHistoricalPayment =
    signal<PaymentResponse | null>(null);

  readonly loadingPolicies = signal(false);
  readonly loadingDetail = signal(false);
  readonly loadingHistoricalPayment = signal(false);
  readonly recordingPayment = signal(false);

  readonly pageError =
    signal<string | null>(null);

  readonly detailError =
    signal<string | null>(null);

  readonly paymentError =
    signal<string | null>(null);

  readonly paymentHistoryError =
    signal<string | null>(null);

  readonly successMessage =
    signal<string | null>(null);

  readonly paymentConfirmationOpen =
    signal(false);

  private readonly paymentDetailCache =
    new Map<number, PaymentResponse>();

  /**
   * Recherche locale par numéro de police
   * ou nom du client.
   */
readonly filteredPolicies = computed(() => {
  const normalizedSearch =
    this.searchTerm()
      .trim()
      .toLocaleLowerCase();

  if (!normalizedSearch) {
    return this.policies();
  }

  return this.policies().filter(
    policy =>
      policy.policyNumber
        .toLocaleLowerCase()
        .includes(normalizedSearch) ||
      policy.clientName
        .toLocaleLowerCase()
        .includes(normalizedSearch),
  );
});

  readonly displayedPolicyCount = computed(
    () => this.filteredPolicies().length,
  );

  readonly totalPolicyCount = computed(
    () => this.policies().length,
  );

  readonly hasActiveFilter = computed(
    () => this.searchTerm().trim().length > 0,
  );

  readonly hasPendingOperation = computed(
    () =>
      this.loadingPolicies() ||
      this.loadingDetail() ||
      this.loadingHistoricalPayment() ||
      this.recordingPayment(),
  );

  ngOnInit(): void {
    this.loadPolicies();
  }

  /**
   * Recharge les synthèses financières.
   */
  loadPolicies(): void {
    if (
      this.loadingPolicies() ||
      this.recordingPayment()
    ) {
      return;
    }

    this.loadingPolicies.set(true);
    this.pageError.set(null);

    this.policiesService
      .getFinancialSummaries()
      .pipe(
        finalize(() => {
          this.loadingPolicies.set(false);
        }),
      )
      .subscribe({
        next: policies => {
          this.policies.set(policies);
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'La liste des polices ne peut pas être chargée.',
            ),
          );
        },
      });
  }

  updateSearchTerm(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Charge le détail financier d'une police.
   */
  openDetail(
    policy: PolicyFinancialSummary,
  ): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.loadingDetail.set(true);

    this.detailError.set(null);
    this.paymentError.set(null);
    this.paymentHistoryError.set(null);

    this.selectedDetail.set(null);
    this.selectedHistoricalPayment.set(null);
    this.paymentDetailCache.clear();

    this.policiesService
      .getFinancialDetails(
        policy.policyNumber,
      )
      .pipe(
        finalize(() => {
          this.loadingDetail.set(false);
        }),
      )
      .subscribe({
        next: detail => {
          this.selectedDetail.set(detail);
        },

        error: (error: HttpErrorResponse) => {
          this.detailError.set(
            resolveApiErrorMessage(
              error,
              'Le détail financier de la police ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  closeDetail(): void {
    if (
      this.recordingPayment() ||
      this.loadingHistoricalPayment()
    ) {
      return;
    }

    this.selectedDetail.set(null);
    this.selectedHistoricalPayment.set(null);

    this.detailError.set(null);
    this.paymentError.set(null);
    this.paymentHistoryError.set(null);

    this.paymentConfirmationOpen.set(false);
    this.paymentDetailCache.clear();
  }

  /**
   * Ouvre la confirmation du paiement total.
   */
  openPaymentConfirmation(): void {
    const detail =
      this.selectedDetail();

    if (
      !detail ||
      detail.simulation.balance <= 0 ||
      this.recordingPayment()
    ) {
      return;
    }

    this.paymentError.set(null);
    this.paymentConfirmationOpen.set(true);
  }

  closePaymentConfirmation(): void {
    if (this.recordingPayment()) {
      return;
    }

    this.paymentConfirmationOpen.set(false);
    this.paymentError.set(null);
  }

  /**
   * Enregistre le paiement puis actualise
   * la liste et le détail de la police.
   */
  confirmPayment(): void {
    const detail =
      this.selectedDetail();

    if (
      !detail ||
      !this.paymentConfirmationOpen() ||
      detail.simulation.balance <= 0 ||
      this.recordingPayment()
    ) {
      return;
    }

    const policyNumber =
      detail.policyNumber;

    this.recordingPayment.set(true);
    this.paymentError.set(null);
    this.successMessage.set(null);

    this.paymentsService
      .recordPayment(policyNumber)
      .pipe(
        switchMap(payment =>
          forkJoin({
            payment: of(payment),

            policies:
              this.policiesService
                .getFinancialSummaries(),

            detail:
              this.policiesService
                .getFinancialDetails(
                  policyNumber,
                ),
          }),
        ),

        finalize(() => {
          this.recordingPayment.set(false);
        }),
      )
      .subscribe({
        next: ({
          payment,
          policies,
          detail: refreshedDetail,
        }) => {
          this.policies.set(policies);
          this.selectedDetail.set(
            refreshedDetail,
          );

          this.paymentDetailCache.clear();
          this.selectedHistoricalPayment.set(null);
          this.paymentHistoryError.set(null);

          this.paymentConfirmationOpen.set(false);
          this.paymentError.set(null);

          this.successMessage.set(
            `Le paiement n° ${payment.id} a été enregistré avec succès pour la police ${policyNumber}.`,
          );
        },

        error: (error: HttpErrorResponse) => {
          this.paymentError.set(
            resolveApiErrorMessage(
              error,
              'Le paiement total ne peut pas être enregistré.',
            ),
          );
        },
      });
  }

  /**
   * Charge le détail figé d'un paiement historique.
   */
  openHistoricalPayment(
    payment: PolicyPaymentHistory,
  ): void {
    if (
      this.recordingPayment() ||
      this.loadingHistoricalPayment()
    ) {
      return;
    }

    const cachedPayment =
      this.paymentDetailCache.get(
        payment.id,
      );

    if (cachedPayment) {
      this.selectedHistoricalPayment.set(
        cachedPayment,
      );

      this.paymentHistoryError.set(null);
      return;
    }

    this.loadingHistoricalPayment.set(true);
    this.paymentHistoryError.set(null);

    this.paymentsService
      .getPayment(payment.id)
      .pipe(
        finalize(() => {
          this.loadingHistoricalPayment.set(
            false,
          );
        }),
      )
      .subscribe({
        next: paymentDetail => {
          this.paymentDetailCache.set(
            paymentDetail.id,
            paymentDetail,
          );

          this.selectedHistoricalPayment.set(
            paymentDetail,
          );
        },

        error: (error: HttpErrorResponse) => {
          this.paymentHistoryError.set(
            resolveApiErrorMessage(
              error,
              'La chronologie de ce paiement ne peut pas être chargée.',
            ),
          );
        },
      });
  }

  /**
   * Normalise une valeur pour la recherche locale.
   *
   * La suppression des accents permet par exemple
   * de retrouver "Jérôme" avec "jerome".
   */
  private normalizeSearchValue(
    value: string | null | undefined,
  ): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase();
  }
}