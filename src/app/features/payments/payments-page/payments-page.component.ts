import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
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
  LucideBan,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideFileSearch,
  LucideHistory,
  LucideReceiptText,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { PaymentDetailDialogComponent } from '../payment-detail-dialog/payment-detail-dialog.component';
import { PaymentResponse } from '../models/payment-response';
import { PaymentsService } from '../payments.service';
import { CancelPaymentDialogComponent } from '../../../shared/ui-components/cancel-payment-dialog.component/cancel-payment-dialog.component';

/**
 * Page de consultation de l'historique des paiements.
 */
@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    PaymentDetailDialogComponent,
    LucideCircleAlert,
    LucideFileSearch,
    LucideHistory,
    LucideReceiptText,
    LucideSearch,
    LucideCircleCheckBig,
    LucideX,
    CancelPaymentDialogComponent,
  ],
  templateUrl: './payments-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPageComponent {
  private readonly paymentsService = inject(PaymentsService);

  readonly authenticationService = inject(AuthenticationService);

    /**
     * Paiement actuellement sélectionné pour annulation.
     */
    readonly paymentToCancel = signal<PaymentResponse | null>(null);

    /**
     * Erreur affichée dans la fenêtre d'annulation.
     */
    readonly cancellationError = signal<string | null>(null);

  readonly policyNumberControl =
    new FormControl('', {
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
  readonly cancelling = signal(false);

  readonly payments = signal<PaymentResponse[]>([]);
  readonly searchedPolicyNumber = signal<string | null>(null);

  readonly selectedPayment = signal<PaymentResponse | null>(null);

  readonly pageError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  searchPayments(): void {
    this.pageError.set(null);
    this.successMessage.set(null);

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
      return;
    }

    this.loading.set(true);
    this.payments.set([]);
    this.searchedPolicyNumber.set(policyNumber);

    this.paymentsService
      .getPolicyPayments(policyNumber)
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (payments) => {
          this.payments.set(payments);
        },
        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  openPayment(payment: PaymentResponse): void {
    this.loading.set(true);
    this.pageError.set(null);

    this.paymentsService
      .getPayment(payment.id)
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.selectedPayment.set(detail);
        },
        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  closePayment(): void {
    if (!this.cancelling()) {
      this.selectedPayment.set(null);
    }
  }

    /**
     * Ouvre la fenêtre de saisie du motif.
     */
    requestCancellation(payment: PaymentResponse,): void {
    if (
        payment.status !== 'PAID' ||
        this.cancelling()
    ) {
        return;
    }

    this.cancellationError.set(null);
    this.paymentToCancel.set(payment);
    }

    /**
     * Ferme la fenêtre d'annulation.
     */
    closeCancellationDialog(): void {
    if (this.cancelling()) {
        return;
    }

    this.paymentToCancel.set(null);
    this.cancellationError.set(null);
    }

    /**
     * Envoie le motif validé au backend.
     */
    confirmCancellation(reason: string,): void {
    const payment = this.paymentToCancel();

    if (!payment || this.cancelling()) {
        return;
    }

    this.cancelling.set(true);
    this.cancellationError.set(null);
    this.pageError.set(null);
    this.successMessage.set(null);

    this.paymentsService
        .cancelPayment(payment.id, {
        reason,
        })
        .pipe(
        finalize(() => {
            this.cancelling.set(false);
        }),
        )
        .subscribe({
        next: (cancelledPayment) => {
            this.replacePayment(cancelledPayment);

            /*
            * Actualise également la fenêtre de détail
            * éventuellement ouverte derrière la confirmation.
            */
            this.selectedPayment.set(
            cancelledPayment,
            );

            this.paymentToCancel.set(null);
            this.cancellationError.set(null);

            this.successMessage.set(
            `Le paiement n° ${cancelledPayment.id} a été annulé avec succès. La situation de la police sera de nouveau prise en compte dans les simulations.`,
            );
        },

        error: (error: HttpErrorResponse) => {
            this.cancellationError.set(
            this.resolveErrorMessage(error),
            );
        },
        });
    }

  private replacePayment(updatedPayment: PaymentResponse,): void {
    this.payments.update((payments) =>
      payments.map((payment) =>
        payment.id === updatedPayment.id
          ? updatedPayment
          : payment,
      ),
    );
  }

  private resolveErrorMessage(error: HttpErrorResponse,): string {
    let body: unknown = error.error;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    const apiError = body as ApiErrorResponse | null;

    if (apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'Le serveur est actuellement inaccessible.';
    }

    return 'Une erreur est survenue pendant le traitement.';
  }
}