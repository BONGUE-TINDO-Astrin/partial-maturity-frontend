import {
  DecimalPipe,
  PercentPipe,
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
import {
  LucideCircleCheckBig,
  LucideCoins,
  LucideEye,
  LucideFileSearch,
  LucideLandmark,
  LucideRefreshCw,
  LucideSearch,
  LucideTrendingUp,
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
import { PaymentsService } from '../../payments/payments.service';
import { PolicyFinancialDetail } from '../models/policy-financial-detail';
import { PoliciesService } from '../policies.service';
import { PolicyFinancialDetailDialogComponent } from '../policy-financial-detail-dialog/policy-financial-detail-dialog.component';
import { PolicyFinancialSummary } from '../models/Créer policy-financial-summary';
import { PolicyPaymentHistory } from '../models/policy-payment-history';
import { PaymentResponse } from '../../payments/models/payment-response';

/**
 * Liste les polices et leur situation financière courante.
 *
 * Les synthèses sont chargées à l'ouverture de la page.
 * La recherche filtre ensuite localement les données reçues,
 * sans déclencher de nouvel appel HTTP.
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
    LucideRefreshCw,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './policies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesPageComponent implements OnInit {
  readonly authenticationService = inject(AuthenticationService);

  private readonly policiesService = inject(PoliciesService);

  private readonly paymentsService = inject(PaymentsService);

  readonly policies = signal<PolicyFinancialSummary[]>([]);

  readonly searchTerm = signal('');

  readonly selectedDetail = signal<PolicyFinancialDetail | null>(null);

    /**
   * Paiement historique actuellement présenté
   * dans la popup de la police.
   */
  readonly selectedHistoricalPayment = signal<PaymentResponse | null>(null);

  /**
   * Indique que la chronologie d'un paiement
   * est actuellement chargée.
   */
  readonly loadingHistoricalPayment = signal(false);

  readonly paymentHistoryError = signal<string | null>(null);

  readonly loadingPolicies = signal(false);
  readonly loadingDetail = signal(false);
  readonly recordingPayment = signal(false);

  readonly pageError = signal<string | null>(null);

  readonly detailError = signal<string | null>(null);

  readonly paymentError = signal<string | null>(null);

  readonly successMessage = signal<string | null>(null);

  readonly paymentConfirmationOpen = signal(false);

  /**
   * Cache limité à la durée d'ouverture de la police.
   *
   * Il évite de rappeler le backend lorsque l'utilisateur
   * revient sur un paiement déjà consulté.
   */
  private readonly paymentDetailCache = new Map<number, PaymentResponse>();

  /**
   * Filtrage local volontairement limité au numéro de police.
   *
   * Le backend n'est pas rappelé à chaque caractère saisi,
   * ce qui rend la recherche immédiate après le chargement.
   */
  readonly filteredPolicies = computed(() => {
    const normalizedSearch =
      this.searchTerm()
        .trim()
        .toLocaleLowerCase();

    if (!normalizedSearch) {
      return this.policies();
    }

    return this.policies().filter((policy) =>
      policy.policyNumber
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
   * Recharge toutes les synthèses financières.
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
        next: (policies) => {
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
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Charge le détail financier uniquement au moment
   * où l'utilisateur souhaite consulter une police.
   */
  openDetail(policy: PolicyFinancialSummary): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.loadingDetail.set(true);
    this.detailError.set(null);
    this.paymentError.set(null);
    this.selectedDetail.set(null);
    this.selectedHistoricalPayment.set(null);
    this.paymentHistoryError.set(null);
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
        next: (detail) => {
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
   * Ouvre la confirmation à partir de la simulation
   * déjà retournée dans le détail financier.
   */
  openPaymentConfirmation(): void {
    const detail = this.selectedDetail();

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
   * Enregistre le paiement puis recharge simultanément
   * la liste et le détail de la police.
   *
   * Aucun montant n'est transmis au backend. Le backend
   * recalcule intégralement la situation dans sa transaction.
   */
  confirmPayment(): void {
    const detail = this.selectedDetail();

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
        /*
         * Après l'enregistrement, la liste et la popup
         * doivent présenter immédiatement la nouvelle
         * situation financière.
         */
        switchMap((payment) =>
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

          /*
          * L'historique de la police a changé.
          * Les détails éventuellement mis en cache ne doivent
          * plus être considérés comme la photographie courante.
          */
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
   * Charge la chronologie figée d'un paiement historique.
   *
   * Les paiements déjà consultés pendant l'ouverture
   * courante sont lus depuis le cache local.
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
        next: detail => {
          this.paymentDetailCache.set(
            detail.id,
            detail,
          );

          this.selectedHistoricalPayment.set(
            detail,
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
}