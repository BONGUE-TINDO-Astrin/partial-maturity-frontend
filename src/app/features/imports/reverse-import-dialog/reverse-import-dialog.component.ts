import { DatePipe } from '@angular/common';
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
  LucideArchiveX,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { ImportBatchDetail } from '../models/import-batch-detail';

/**
 * Demande la confirmation et le motif
 * de réversion d'un chargement.
 *
 * Le composant ne réalise aucun appel HTTP.
 */
@Component({
  selector: 'app-reverse-import-dialog',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideArchiveX,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl:
    './reverse-import-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReverseImportDialogComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly batch = input.required<ImportBatchDetail>();

  readonly submitting = input(false);

  readonly serverError = input<string | null>(null);

  readonly closeDialog = output<void>();

  readonly confirmReversal = output<string>();

  readonly form =
    this.formBuilder.nonNullable.group({
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
      this.form.controls.reason.setErrors({
        required: true,
      });

      this.form.controls.reason.markAsTouched();
      return;
    }

    this.confirmReversal.emit(reason);
  }
}