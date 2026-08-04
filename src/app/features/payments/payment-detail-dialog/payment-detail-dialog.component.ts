import {
  DatePipe,
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  LucideBan,
  LucideCircleCheckBig,
  LucideReceiptText,
  LucideX,
} from '@lucide/angular';

import { PaymentResponse } from '../models/payment-response';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';

/**
 * Présente un paiement et les étapes financières
 * conservées lors de son enregistrement.
 */
@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    LocalDatePipe,
    DecimalPipe,
    PercentPipe,
    LucideBan,
    LucideCircleCheckBig,
    LucideReceiptText,
    LucideX,
  ],
  templateUrl: './payment-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailDialogComponent {
  readonly payment = input.required<PaymentResponse>();
  readonly canCancel = input(false);
  readonly cancelling = input(false);

  readonly closeDialog = output<void>();
  readonly requestCancellation = output<PaymentResponse>();

  close(): void {
    if (!this.cancelling()) {
      this.closeDialog.emit();
    }
  }

  cancelPayment(): void {
    if (
      this.payment().status === 'PAID' &&
      this.canCancel() &&
      !this.cancelling()
    ) {
      this.requestCancellation.emit(this.payment());
    }
  }
}
