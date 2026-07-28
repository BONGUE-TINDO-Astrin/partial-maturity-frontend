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
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { ImportBatchDetail } from '../models/import-batch-detail';
import { PolicyMaturity } from '../models/policy-maturity';

/**
 * Affiche le rapport complet d'un chargement CSV.
 *
 * Le composant ne réalise aucun appel HTTP.
 * Toutes les données sont chargées par ImportsPageComponent
 * puis transmises au moyen d'inputs.
 */
@Component({
  selector: 'app-import-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    LucideCircleCheckBig,
    LucideFileText,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './import-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDetailDialogComponent {
  /**
   * Informations complètes du lot consulté.
   */
  readonly detail =
    input.required<ImportBatchDetail>();

  /**
   * Maturités réellement insérées par le lot.
   *
   * La liste reste vide pour :
   * - un lot rejeté ;
   * - une réimportation sans nouvelle maturité.
   */
  readonly maturities =
    input<PolicyMaturity[]>([]);

  readonly loadingMaturities = input(false);

  readonly closeDialog = output<void>();

  close(): void {
    this.closeDialog.emit();
  }
}