import {
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronUp,
  LucideCircleCheckBig,
  LucideCircleDot,
  LucideCoins,
  LucideCreditCard,
  LucideHistory,
  LucideLandmark,
  LucideListOrdered,
  LucideLoaderCircle,
  LucideLockKeyhole,
  LucideReceiptText,
  LucideRefreshCw,
  LucideTrendingUp,
  LucideX,
} from '@lucide/angular';

import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { PaymentResponse } from '../../payments/models/payment-response';
import { PolicyFinancialDetail } from '../models/policy-financial-detail';
import { PolicyFinancialDetailTab } from '../models/policy-financial-detail-tab';
import { PolicyPaymentHistory } from '../models/policy-payment-history';

/**
 * Présente la situation financière complète d'une police.
 *
 * Le composant organise les informations en trois vues :
 *
 * - vue d'ensemble ;
 * - historique des paiements valides ;
 * - maturités enregistrées.
 *
 * Le composant ne réalise aucun appel HTTP et ne calcule
 * aucun montant financier.
 */
@Component({
  selector: 'app-policy-financial-detail-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    PercentPipe,
    LocalDatePipe,
    LucideCalendarDays,
    LucideChevronDown,
    LucideChevronUp,
    LucideCircleCheckBig,
    LucideCircleDot,
    LucideCoins,
    LucideCreditCard,
    LucideHistory,
    LucideLandmark,
    LucideListOrdered,
    LucideLoaderCircle,
    LucideLockKeyhole,
    LucideReceiptText,
    LucideRefreshCw,
    LucideTrendingUp,
    LucideX,
  ],
  templateUrl:
    './policy-financial-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyFinancialDetailDialogComponent {
  readonly detail =
    input.required<PolicyFinancialDetail>();

  readonly recordingPayment = input(false);

  readonly canRecordPayment = input(false);

  /**
   * Paiement historique actuellement sélectionné.
   *
   * La valeur est chargée par le composant parent.
   */
  readonly selectedPayment =
    input<PaymentResponse | null>(null);

  readonly loadingPayment =
    input(false);

  readonly paymentHistoryError =
    input<string | null>(null);

  readonly closeDialog = output<void>();

  readonly recordPayment = output<void>();

  /**
   * Demande au parent de charger le détail
   * d'un paiement historique.
   */
  readonly selectPayment =
    output<PolicyPaymentHistory>();

  /**
   * Vue ouverte par défaut.
   */
  readonly activeTab =
    signal<PolicyFinancialDetailTab>(
      'OVERVIEW',
    );

  /**
   * La chronologie courante reste repliée
   * pour alléger la première lecture.
   */
  readonly currentCalculationExpanded =
    signal(false);

  readonly hasPayableBalance = computed(
    () =>
      this.detail().simulation.balance > 0,
  );

  readonly paymentAvailable = computed(
    () =>
      this.canRecordPayment() &&
      this.hasPayableBalance() &&
      !this.recordingPayment(),
  );

  readonly hasPayments = computed(
    () => this.detail().payments.length > 0,
  );

  readonly selectedPaymentId = computed(
    () => this.selectedPayment()?.id ?? null,
  );

  /**
   * Change de vue.
   *
   * Lors de la première ouverture de l'historique,
   * le paiement valide le plus récent est sélectionné.
   */
  selectTab(
    tab: PolicyFinancialDetailTab,
  ): void {
    if (
      this.recordingPayment() ||
      this.loadingPayment()
    ) {
      return;
    }

    if (
      tab === 'PAYMENTS' &&
      !this.hasPayments()
    ) {
      return;
    }

    this.activeTab.set(tab);

    if (
      tab === 'PAYMENTS' &&
      this.selectedPayment() === null
    ) {
      const latestPayment =
        this.detail().payments[0];

      if (latestPayment) {
        this.selectPayment.emit(
          latestPayment,
        );
      }
    }
  }

  selectHistoricalPayment(
    payment: PolicyPaymentHistory,
  ): void {
    if (
      this.loadingPayment() ||
      this.recordingPayment() ||
      payment.id === this.selectedPaymentId()
    ) {
      return;
    }

    this.selectPayment.emit(payment);
  }

  toggleCurrentCalculation(): void {
    this.currentCalculationExpanded.update(
      expanded => !expanded,
    );
  }

  close(): void {
    if (
      !this.recordingPayment() &&
      !this.loadingPayment()
    ) {
      this.closeDialog.emit();
    }
  }

  requestPayment(): void {
    if (this.paymentAvailable()) {
      this.recordPayment.emit();
    }
  }
}