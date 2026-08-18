import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  LucideArchiveX,
  LucideBan,
  LucideCircleCheckBig,
  LucideFileText,
  LucideRefreshCw,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { ImportBatchDetail } from '../models/import-batch-detail';
import { PolicyMaturity } from '../models/policy-maturity';

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
    LucideArchiveX,
    LucideBan,
    LucideCircleCheckBig,
    LucideFileText,
    LucideRefreshCw,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl:
    './import-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDetailDialogComponent {
  readonly detail = input.required<ImportBatchDetail>();

  readonly maturities = input<PolicyMaturity[]>([]);

  readonly loadingMaturities = input(false);

  readonly reversing = input(false);

  /**
   * Autorisation déjà calculée par la page à partir
   * du rôle de l'utilisateur connecté.
   */
  readonly canReverse = input(false);

  readonly closeDialog = output<void>();

  readonly requestReversal = output<ImportBatchDetail>();

  /**
   * Un lot importé sans aucune nouvelle maturité
   * n'a rien à retirer et ne doit donc pas proposer
   * une réversion.
   */
  readonly reversalAvailable = computed(
    () =>
      this.canReverse() &&
      this.detail().status === 'IMPORTED' &&
      this.detail().reversible &&
      !this.loadingMaturities() &&
      !this.reversing(),
  );

  close(): void {
    if (
      !this.loadingMaturities() &&
      !this.reversing()
    ) {
      this.closeDialog.emit();
    }
  }

  reverseBatch(): void {
    if (this.reversalAvailable()) {
      this.requestReversal.emit(
        this.detail(),
      );
    }
  }
}