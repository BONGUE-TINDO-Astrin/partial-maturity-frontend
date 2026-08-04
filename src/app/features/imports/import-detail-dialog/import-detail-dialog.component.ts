import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  LucideCircleCheckBig,
  LucideFileText,
  LucideRefreshCw,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { ImportBatchDetail } from '../models/import-batch-detail';
import { PolicyMaturity } from '../models/policy-maturity';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';

/**
 * Affiche le rapport complet d'un chargement CSV.
 *
 * Le composant ne réalise aucun appel HTTP.
 */
@Component({
  selector: 'app-import-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    LocalDatePipe,
    DecimalPipe,
    LucideCircleCheckBig,
    LucideFileText,
    LucideRefreshCw,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './import-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDetailDialogComponent {
  readonly detail = input.required<ImportBatchDetail>();

  readonly maturities = input<PolicyMaturity[]>([]);

  readonly loadingMaturities = input(false);

  readonly closeDialog = output<void>();

  close(): void {
    if (!this.loadingMaturities()) {
      this.closeDialog.emit();
    }
  }
}
