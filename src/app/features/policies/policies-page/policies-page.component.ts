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
  LucideCalendarDays,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideCoins,
  LucideFileSearch,
  LucideListOrdered,
  LucideRefreshCw,
  LucideSearch,
  LucideCalculator,
  LucideTrendingUp,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { PolicyDetail } from '../models/policy-detail';
import { PolicyMaturity } from '../models/policy-maturity';
import { PoliciesService } from '../policies.service';
import { InterestSimulation } from '../models/interest-simulation';
import { PaymentsService } from '../../payments/payments.service';
import { PaymentResponse } from '../../payments/models/payment-response';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { PaymentConfirmationDialogComponent } from '../../../shared/ui-components/payment-confirmation-dialog.component/payment-confirmation-dialog.component';

/**
 * Écran de recherche et de consultation d'une police.
 *
 * Responsabilités :
 * - collecter le numéro de police ;
 * - appeler l'API de consultation ;
 * - afficher le résumé financier ;
 * - afficher les maturités dans l'ordre de leurs rangs ;
 * - distinguer une police inconnue d'une erreur technique.
 *
 * Tous les calculs financiers sont réalisés côté backend
 * avec BigDecimal. Le frontend affiche uniquement les valeurs
 * retournées par l'API.
 */
@Component({
  selector: 'app-policies-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PercentPipe,
    ReactiveFormsModule,
    LucideCalendarDays,
    LucideCircleAlert,
    LucideCircleCheckBig,
    LucideCoins,
    LucideFileSearch,
    LucideListOrdered,
    LucideRefreshCw,
    LucideSearch,
    LucideCalculator,
    LucideTrendingUp,
    PaymentConfirmationDialogComponent,
  ],
  templateUrl: './policies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesPageComponent {
    readonly authenticationService = inject(AuthenticationService);
    
  private readonly policiesService = inject(PoliciesService);

  private readonly paymentsService = inject(PaymentsService);

  readonly recordingPayment = signal(false);

  readonly lastRecordedPayment = signal<PaymentResponse | null>(null);

    /**
     * Contrôle l'affichage de la fenêtre de confirmation.
     */
    readonly paymentConfirmationOpen = signal(false);

    /**
     * Erreur retournée pendant l'enregistrement du paiement.
     */
    readonly paymentError = signal<string | null>(null);

    /**
     * Message affiché après un paiement réussi.
     */
    readonly paymentSuccessMessage = signal<string | null>(null);

    /**
     * Indique qu'une simulation est en cours.
     */
    readonly simulating = signal(false);

    /**
     * Dernière simulation retournée par le backend.
     */
    readonly simulation = signal<InterestSimulation | null>(null);

    /**
     * Erreur spécifique au calcul financier.
     */
    readonly simulationError = signal<string | null>(null);

  /**
   * Contrôle du numéro de police.
   *
   * Le numéro reste une chaîne afin de préserver
   * les éventuels zéros initiaux.
   */
  readonly policyNumberControl =
    new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(100),
        ],
      },
    );

    /**
     * Formulaire réactif de recherche.
     *
     * Le FormGroup permet à Angular de prendre en charge la soumission
     * et empêche la soumission HTML native de recharger la page.
     */
    readonly searchForm = new FormGroup({
        policyNumber: this.policyNumberControl,
    });

  readonly loading = signal(false);

  /**
   * Police actuellement affichée.
   */
  readonly policy = signal<PolicyDetail | null>(null,);

  /**
   * Message affiché lorsqu'aucune police ne correspond
   * au numéro recherché.
   */
  readonly notFoundMessage = signal<string | null>(null);

  /**
   * Message réservé aux erreurs techniques ou inattendues.
   */
  readonly pageError = signal<string | null>(null);

  /**
   * Dernier numéro effectivement recherché.
   *
   * Il est séparé de la valeur du champ pour que
   * le message d'absence reste stable si l'utilisateur
   * commence immédiatement une nouvelle saisie.
   */
  readonly searchedPolicyNumber = signal<string | null>(null);

  readonly hasResult = computed(
    () => this.policy() !== null,
  );

  readonly maturities = computed<PolicyMaturity[]>(
    () => this.policy()?.maturities ?? [],
  );

  /**
   * Retourne le nombre total de maturités.
   */
  readonly maturityCount = computed(
    () => this.policy()?.maturityCount ?? 0,
  );

    /**
     * Lance la recherche d'une police.
     */
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
            this.policyNumberControl.setErrors({
            required: true,
            });

            this.policyNumberControl.markAsTouched();
            return;
        }

        this.loading.set(true);
        this.policy.set(null);
        this.searchedPolicyNumber.set(
            policyNumber,
        );

        this.simulation.set(null);
        this.simulationError.set(null);

        this.paymentConfirmationOpen.set(false);
        this.paymentError.set(null);
        this.paymentSuccessMessage.set(null);
        this.lastRecordedPayment.set(null);

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
   * Relance la dernière recherche disponible.
   */
  refreshPolicy(): void {
    if (this.loading()) {
      return;
    }

    const currentPolicy = this.policy();

    const lastPolicyNumber =
      currentPolicy?.policyNumber ??
      this.searchedPolicyNumber();

    if (!lastPolicyNumber) {
      return;
    }

    this.policyNumberControl.setValue(
      lastPolicyNumber,
      {
        emitEvent: false,
      },
    );

    this.searchPolicy();
  }

  /**
   * Efface le résultat et prépare une nouvelle recherche.
   */
  clearSearch(): void {
    if (this.loading()) {
      return;
    }

    this.policy.set(null);
    this.pageError.set(null);
    this.notFoundMessage.set(null);
    this.searchedPolicyNumber.set(null);

    this.simulation.set(null);
    this.simulationError.set(null);

    this.paymentConfirmationOpen.set(false);
    this.paymentError.set(null);
    this.paymentSuccessMessage.set(null);
    this.lastRecordedPayment.set(null);

    this.policyNumberControl.reset('');
    this.policyNumberControl.markAsUntouched();
  }

  /**
   * Distingue une police inconnue d'une panne technique.
   */
  private handleSearchError(
    error: HttpErrorResponse,
  ): void {
    const apiError = this.extractApiError(error);

    if (
      error.status === 404 &&
      apiError?.code === 'POLICY_NOT_FOUND'
    ) {
      this.notFoundMessage.set(
        apiError.message ??
        `Aucune maturité n'est disponible pour la police '${this.searchedPolicyNumber()}'.`,
      );

      return;
    }

    if (
      error.status === 400 &&
      apiError?.code ===
        'INVALID_POLICY_NUMBER'
    ) {
      this.pageError.set(
        apiError.message ??
        'Le numéro de police est invalide.',
      );

      return;
    }

    if (error.status === 0) {
      this.pageError.set(
        'Le serveur est actuellement inaccessible.',
      );

      return;
    }

    this.pageError.set(
      apiError?.message ??
      'Une erreur est survenue pendant la recherche.',
    );
  }

  /**
   * Extrait le format d'erreur standard du backend.
   *
   * Certaines configurations HTTP peuvent retourner
   * error.error sous forme d'objet ou de chaîne JSON.
   */
  private extractApiError(
    error: HttpErrorResponse,
  ): ApiErrorResponse | null {
    let responseBody: unknown = error.error;

    if (typeof responseBody === 'string') {
      try {
        responseBody =
          JSON.parse(responseBody);
      } catch {
        return null;
      }
    }

    if (
      responseBody === null ||
      typeof responseBody !== 'object'
    ) {
      return null;
    }

    return responseBody as ApiErrorResponse;
  }

    /**
     * Simule la situation financière de la police affichée.
     *
     * La date et le taux sont déterminés par le backend.
     */
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
                const apiError =
                this.extractApiError(error);

                this.simulationError.set(
                apiError?.message ??
                'La simulation des intérêts a échoué.',
                );
            },
        });
    }

    /**
     * Ouvre la fenêtre de confirmation du paiement.
     */
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

        /**
         * Ferme la fenêtre de confirmation.
         */
        closePaymentConfirmation(): void {
        if (this.recordingPayment()) {
            return;
        }

        this.paymentConfirmationOpen.set(false);
        this.paymentError.set(null);
    }

    /**
     * Recalcule et enregistre le paiement total.
     *
     * Aucun montant n'est transmis au backend.
     */
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
            .pipe(
            finalize(() => {
                this.recordingPayment.set(false);
            }),
            )
            .subscribe({
            next: (payment) => {
                this.lastRecordedPayment.set(payment);
                this.paymentConfirmationOpen.set(false);
                this.paymentError.set(null);

                this.paymentSuccessMessage.set(
                `Le paiement n° ${payment.id} d’un montant de ${this.formatFinancialAmount(payment.paidAmount)} a été enregistré avec succès.`,
                );

                /*
                * Le paiement PAID remet la situation ouverte à zéro.
                * Une nouvelle simulation est donc immédiatement demandée.
                */
                this.simulateInterest();
            },

            error: (error: HttpErrorResponse) => {
                const apiError =
                this.extractApiError(error);

                this.paymentError.set(
                apiError?.message ??
                'Le paiement n’a pas pu être enregistré.',
                );
            },
        });
    }

    /**
     * Formate un montant avec exactement six décimales
     * pour les messages textuels.
     */
    private formatFinancialAmount(amount: number,): string {
    return new Intl.NumberFormat(
        'fr-FR',
        {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
        },
    ).format(amount);
    }

}