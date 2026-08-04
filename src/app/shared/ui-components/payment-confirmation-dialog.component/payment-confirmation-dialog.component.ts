import {
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  LucideCircleAlert,
  LucideCreditCard,
  LucideX,
} from '@lucide/angular';

import { InterestSimulation } from '../../../features/policies/models/interest-simulation';
import { LocalDatePipe } from '../../pipes/local-date.pipe';

/**
 * Demande la confirmation avant l'enregistrement
 * du paiement total d'une police.
 *
 * Le montant affiché est informatif. Aucun montant n'est envoyé
 * au backend, qui recalcule toujours la situation financière
 * dans sa propre transaction.
 */
@Component({
  selector: 'app-payment-confirmation-dialog',
  standalone: true,
  imports: [
    LocalDatePipe,
    DecimalPipe,
    LucideCircleAlert,
    LucideCreditCard,
    LucideX,
  ],
  templateUrl: './payment-confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentConfirmationDialogComponent {
  readonly policyNumber = input.required<string>();
  readonly simulation = input.required<InterestSimulation>();
  readonly submitting = input(false);
  readonly serverError = input<string | null>(null);

  readonly closeDialog = output<void>();
  readonly confirmPayment = output<void>();

  close(): void {
    if (!this.submitting()) {
      this.closeDialog.emit();
    }
  }

  confirm(): void {
    if (
      !this.submitting() &&
      this.simulation().balance > 0
    ) {
      this.confirmPayment.emit();
    }
  }
}
