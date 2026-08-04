import {
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideBan,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { PaymentResponse } from '../../../features/payments/models/payment-response';
import { LocalDatePipe } from '../../pipes/local-date.pipe';

/**
 * Fenêtre de confirmation et de saisie du motif
 * d'annulation d'un paiement.
 */
@Component({
  selector: 'app-cancel-payment-dialog',
  standalone: true,
  imports: [
    LocalDatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    LucideBan,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './cancel-payment-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelPaymentDialogComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly payment = input.required<PaymentResponse>();
  readonly submitting = input(false);
  readonly serverError = input<string | null>(null);

  readonly closeDialog = output<void>();
  readonly confirmCancellation = output<string>();

  readonly form = this.formBuilder.nonNullable.group({
    reason: [
      '',
      [
        Validators.required,
        Validators.maxLength(500),
      ],
    ],
  });

  close(): void {
    if (!this.submitting()) {
      this.closeDialog.emit();
    }
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reason = this.form.controls.reason.value.trim();

    if (!reason) {
      this.form.controls.reason.setErrors({ required: true });
      this.form.controls.reason.markAsTouched();
      return;
    }

    this.confirmCancellation.emit(reason);
  }
}
