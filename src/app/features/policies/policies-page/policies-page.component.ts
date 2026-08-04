import {
  DatePipe,
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideCalculator,
  LucideCalendarDays,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideCoins,
  LucideFileSearch,
  LucideListOrdered,
  LucideRefreshCw,
  LucideSearch,
  LucideTrendingUp,
  LucideX,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import {
  extractApiError,
  resolveApiErrorMessage,
} from '../../../core/error-handling/api-error-utils';
import { PaymentConfirmationDialogComponent } from '../../../shared/ui-components/payment-confirmation-dialog.component/payment-confirmation-dialog.component';
import { PaymentResponse } from '../../payments/models/payment-response';
import { PaymentsService } from '../../payments/payments.service';
import { InterestSimulation } from '../models/interest-simulation';
import { PolicyDetail } from '../models/policy-detail';
import { PolicyMaturity } from '../models/policy-maturity';
import { PoliciesService } from '../policies.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';

/**
 * Écran de recherche, consultation et simulation d'une police.
 *
 * Tous les calculs financiers sont réalisés par le backend.
 */
@Component({
  selector: 'app-policies-page',
  standalone: true,
  imports: [
    DatePipe,
    LocalDatePipe,
    DecimalPipe,
    PercentPipe,
    ReactiveFormsModule,
    PaymentConfirmationDialogComponent,
    LucideCalculator,
    LucideCalendarDays,
    LucideCircleAlert,
    LucideCircleCheckBig,
    LucideCoins,
    LucideFileSearch,
    LucideListOrdered,
    LucideRefreshCw,
    LucideSearch,
    LucideTrendingUp,
    LucideX,
  ],
  templateUrl: './policies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesPageComponent {
  readonly authenticationService =
    inject(AuthenticationService);

  private readonly policiesService =
    inject(PoliciesService);

  private readonly paymentsService =
    inject(PaymentsService);

  readonly policyNumberControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.maxLength(100),
    ],
  });

  readonly searchForm = new FormGroup({
    policyNumber: this.policyNumberControl,
  });

  /*
   * Chaque opération conserve son propre état afin que le template
   * puisse afficher précisément l'action en cours.
   */
  readonly loading = signal(false);
  readonly simulating = signal(false);
  readonly recordingPayment = signal(false);

  readonly policy =
    signal<PolicyDetail | null>(null);

  readonly simulation =
    signal<InterestSimulation | null>(null);

  readonly lastRecordedPayment =
    signal<PaymentResponse | null>(null);

  readonly searchedPolicyNumber =
    signal<string | null>(null);

  readonly notFoundMessage =
    signal<string | null>(null);

  readonly pageError =
    signal<string | null>(null);

  readonly simulationError =
    signal<string | null>(null);

  readonly paymentError =
    signal<string | null>(null);

  readonly paymentSuccessMessage =
    signal<string | null>(null);

  readonly paymentConfirmationOpen =
    signal(false);

  readonly hasResult = computed(
    () => this.policy() !== null,
  );

  /**
   * Indique qu'une opération serveur susceptible de modifier
   * l'état de la page est actuellement en cours.
   */
  readonly hasPendingOperation = computed(
    () =>
      this.loading() ||
      this.simulating() ||
      this.recordingPayment(),
  );

  readonly maturities = computed<
    PolicyMaturity[]
  >(
    () => this.policy()?.maturities ?? [],
  );

  /**
   * Recherche une police et réinitialise les résultats
   * financiers associés à la recherche précédente.
   */
  searchPolicy(): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.pageError.set(null);
    this.notFoundMessage.set(null);

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const policyNumber =
      this.policyNumberControl.value.trim();

    if (!policyNumber) {
      this.policyNumberControl.setErrors({
        required: true,
      });

      this.policyNumberControl.markAsTouched();
      return;
    }

    this.resetFinancialState();

    this.loading.set(true);
    this.policy.set(null);
    this.searchedPolicyNumber.set(
      policyNumber,
    );

    this.policiesService
      .getPolicyDetails(policyNumber)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (policy) => {
          this.policy.set(policy);

          this.policyNumberControl.setValue(
            policy.policyNumber,
            {
              emitEvent: false,
            },
          );
        },

        error: (error: HttpErrorResponse) => {
          this.handleSearchError(error);
        },
      });
  }

  /**
   * Recharge la police actuellement affichée.
   */
  refreshPolicy(): void {
    if (this.hasPendingOperation()) {
      return;
    }

    const policyNumber =
      this.policy()?.policyNumber ??
      this.searchedPolicyNumber();

    if (!policyNumber) {
      return;
    }

    this.policyNumberControl.setValue(
      policyNumber,
      {
        emitEvent: false,
      },
    );

    this.searchPolicy();
  }

  /**
   * Revient à l'état initial de la page.
   */
  clearSearch(): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.policy.set(null);
    this.searchedPolicyNumber.set(null);
    this.notFoundMessage.set(null);
    this.pageError.set(null);

    this.resetFinancialState();

    this.policyNumberControl.reset('');
    this.policyNumberControl.markAsUntouched();
  }

  /**
   * Demande au backend de recalculer la situation financière
   * de la police actuellement affichée.
   */
  simulateInterest(): void {
    const currentPolicy = this.policy();

    if (
      !currentPolicy ||
      this.hasPendingOperation()
    ) {
      return;
    }

    this.simulating.set(true);
    this.simulation.set(null);
    this.simulationError.set(null);

    this.policiesService
      .simulate(currentPolicy.policyNumber)
      .pipe(
        finalize(() => {
          this.simulating.set(false);
        }),
      )
      .subscribe({
        next: (simulation) => {
          this.simulation.set(simulation);
        },

        error: (error: HttpErrorResponse) => {
          this.simulationError.set(
            resolveApiErrorMessage(
              error,
              'La simulation des intérêts a échoué.',
            ),
          );
        },
      });
  }

  /**
   * Ouvre la confirmation uniquement lorsqu'une simulation
   * possède encore un solde strictement positif.
   */
  openPaymentConfirmation(): void {
    const currentSimulation = this.simulation();

    if (
      !currentSimulation ||
      currentSimulation.balance <= 0 ||
      this.hasPendingOperation()
    ) {
      return;
    }

    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);
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
   * Enregistre le paiement total de la police.
   *
   * Aucun montant calculé par le frontend n'est envoyé.
   * Le backend recalcule la situation dans sa transaction.
   */
  confirmPayment(): void {
    const currentPolicy = this.policy();
    const currentSimulation = this.simulation();

    if (
      !this.paymentConfirmationOpen() ||
      !currentPolicy ||
      !currentSimulation ||
      currentSimulation.balance <= 0 ||
      this.hasPendingOperation()
    ) {
      return;
    }

    this.recordingPayment.set(true);
    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);

    this.paymentsService
      .recordPayment(currentPolicy.policyNumber)
      .pipe(
        finalize(() => {
          this.recordingPayment.set(false);
        }),
      )
      .subscribe({
        next: (payment) => {
          this.lastRecordedPayment.set(payment);
          this.paymentConfirmationOpen.set(false);

          this.paymentSuccessMessage.set(
            `Le paiement n° ${payment.id} d’un montant de ${this.formatFinancialAmount(payment.paidAmount)} a été enregistré avec succès.`,
          );

          /*
           * Le callback next est exécuté avant finalize.
           * L'état est libéré ici pour permettre le recalcul
           * immédiat de la situation après le paiement.
           */
          this.recordingPayment.set(false);
          this.simulateInterest();
        },

        error: (error: HttpErrorResponse) => {
          this.paymentError.set(
            resolveApiErrorMessage(
              error,
              'Le paiement n’a pas pu être enregistré.',
            ),
          );
        },
      });
  }

  /**
   * Efface les résultats et les messages liés à la simulation
   * ainsi qu'au dernier enregistrement de paiement.
   */
  private resetFinancialState(): void {
    this.simulation.set(null);
    this.simulationError.set(null);
    this.paymentConfirmationOpen.set(false);
    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);
    this.lastRecordedPayment.set(null);
  }

  /**
   * Oriente les erreurs de recherche vers l'état visuel adapté.
   *
   * Une police absente est présentée comme un résultat vide,
   * tandis qu'un numéro invalide reste une erreur de saisie.
   */
  private handleSearchError(
    error: HttpErrorResponse,
  ): void {
    const apiError = extractApiError(error);

    if (
      error.status === 404 &&
      apiError?.code === 'POLICY_NOT_FOUND'
    ) {
      this.notFoundMessage.set(
        apiError.message?.trim() ||
          `Aucune maturité n'est disponible pour la police '${this.searchedPolicyNumber()}'.`,
      );

      return;
    }

    if (
      error.status === 400 &&
      apiError?.code === 'INVALID_POLICY_NUMBER'
    ) {
      this.pageError.set(
        apiError.message?.trim() ||
          'Le numéro de police est invalide.',
      );

      return;
    }

    this.pageError.set(
      resolveApiErrorMessage(
        error,
        'Une erreur est survenue pendant la recherche.',
      ),
    );
  }

  private formatFinancialAmount(
    amount: number,
  ): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(amount);
  }
}