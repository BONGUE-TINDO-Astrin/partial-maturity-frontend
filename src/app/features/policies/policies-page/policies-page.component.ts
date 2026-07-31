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
import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { PaymentConfirmationDialogComponent } from '../../../shared/ui-components/payment-confirmation-dialog.component/payment-confirmation-dialog.component';
import { PaymentResponse } from '../../payments/models/payment-response';
import { PaymentsService } from '../../payments/payments.service';
import { InterestSimulation } from '../models/interest-simulation';
import { PolicyDetail } from '../models/policy-detail';
import { PolicyMaturity } from '../models/policy-maturity';
import { PoliciesService } from '../policies.service';

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
    DecimalPipe,
    PercentPipe,
    ReactiveFormsModule,
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
    PaymentConfirmationDialogComponent,
  ],
  templateUrl: './policies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesPageComponent {
  readonly authenticationService = inject(AuthenticationService);

  private readonly policiesService = inject(PoliciesService);
  private readonly paymentsService = inject(PaymentsService);

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

  readonly loading = signal(false);
  readonly simulating = signal(false);
  readonly recordingPayment = signal(false);

  readonly policy = signal<PolicyDetail | null>(null);
  readonly simulation = signal<InterestSimulation | null>(null);
  readonly lastRecordedPayment = signal<PaymentResponse | null>(null);

  readonly searchedPolicyNumber = signal<string | null>(null);
  readonly notFoundMessage = signal<string | null>(null);
  readonly pageError = signal<string | null>(null);
  readonly simulationError = signal<string | null>(null);
  readonly paymentError = signal<string | null>(null);
  readonly paymentSuccessMessage = signal<string | null>(null);
  readonly paymentConfirmationOpen = signal(false);

  readonly hasResult = computed(() => this.policy() !== null);

  readonly maturities = computed<PolicyMaturity[]>(
    () => this.policy()?.maturities ?? [],
  );

  searchPolicy(): void {
    if (this.loading()) {
      return;
    }

    this.pageError.set(null);
    this.notFoundMessage.set(null);

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const policyNumber = this.policyNumberControl.value.trim();

    if (!policyNumber) {
      this.policyNumberControl.setErrors({ required: true });
      this.policyNumberControl.markAsTouched();
      return;
    }

    this.resetFinancialState();
    this.loading.set(true);
    this.policy.set(null);
    this.searchedPolicyNumber.set(policyNumber);

    this.policiesService
      .getPolicyDetails(policyNumber)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (policy) => {
          this.policy.set(policy);
          this.policyNumberControl.setValue(policy.policyNumber, {
            emitEvent: false,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.handleSearchError(error);
        },
      });
  }

  refreshPolicy(): void {
    if (this.loading()) {
      return;
    }

    const policyNumber =
      this.policy()?.policyNumber ?? this.searchedPolicyNumber();

    if (!policyNumber) {
      return;
    }

    this.policyNumberControl.setValue(policyNumber, {
      emitEvent: false,
    });
    this.searchPolicy();
  }

  clearSearch(): void {
    if (this.loading()) {
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

  simulateInterest(): void {
    const currentPolicy = this.policy();

    if (!currentPolicy || this.simulating()) {
      return;
    }

    this.simulating.set(true);
    this.simulation.set(null);
    this.simulationError.set(null);

    this.policiesService
      .simulate(currentPolicy.policyNumber)
      .pipe(finalize(() => this.simulating.set(false)))
      .subscribe({
        next: (simulation) => this.simulation.set(simulation),
        error: (error: HttpErrorResponse) => {
          this.simulationError.set(
            this.extractApiError(error)?.message ??
              'La simulation des intérêts a échoué.',
          );
        },
      });
  }

  openPaymentConfirmation(): void {
    const currentSimulation = this.simulation();

    if (
      !currentSimulation ||
      currentSimulation.balance <= 0 ||
      this.recordingPayment()
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

  confirmPayment(): void {
    const currentPolicy = this.policy();

    if (!currentPolicy || this.recordingPayment()) {
      return;
    }

    this.recordingPayment.set(true);
    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);

    this.paymentsService
      .recordPayment(currentPolicy.policyNumber)
      .pipe(finalize(() => this.recordingPayment.set(false)))
      .subscribe({
        next: (payment) => {
          this.lastRecordedPayment.set(payment);
          this.paymentConfirmationOpen.set(false);
          this.paymentSuccessMessage.set(
            `Le paiement n° ${payment.id} d’un montant de ${this.formatFinancialAmount(payment.paidAmount)} a été enregistré avec succès.`,
          );
          this.simulateInterest();
        },
        error: (error: HttpErrorResponse) => {
          this.paymentError.set(
            this.extractApiError(error)?.message ??
              'Le paiement n’a pas pu être enregistré.',
          );
        },
      });
  }

  private resetFinancialState(): void {
    this.simulation.set(null);
    this.simulationError.set(null);
    this.paymentConfirmationOpen.set(false);
    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);
    this.lastRecordedPayment.set(null);
  }

  private handleSearchError(error: HttpErrorResponse): void {
    const apiError = this.extractApiError(error);

    if (error.status === 404 && apiError?.code === 'POLICY_NOT_FOUND') {
      this.notFoundMessage.set(
        apiError.message ??
          `Aucune maturité n'est disponible pour la police '${this.searchedPolicyNumber()}'.`,
      );
      return;
    }

    if (
      error.status === 400 &&
      apiError?.code === 'INVALID_POLICY_NUMBER'
    ) {
      this.pageError.set(
        apiError.message ?? 'Le numéro de police est invalide.',
      );
      return;
    }

    this.pageError.set(
      error.status === 0
        ? 'Le serveur est actuellement inaccessible.'
        : apiError?.message ??
            'Une erreur est survenue pendant la recherche.',
    );
  }

  private extractApiError(
    error: HttpErrorResponse,
  ): ApiErrorResponse | null {
    let responseBody: unknown = error.error;

    if (typeof responseBody === 'string') {
      try {
        responseBody = JSON.parse(responseBody);
      } catch {
        return null;
      }
    }

    if (responseBody === null || typeof responseBody !== 'object') {
      return null;
    }

    return responseBody as ApiErrorResponse;
  }

  private formatFinancialAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(amount);
  }
}
