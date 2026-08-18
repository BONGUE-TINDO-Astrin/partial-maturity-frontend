import { ImportBatchStatus } from '../../imports/models/import-batch-status';

/**
 * Chargement récent affiché sur le dashboard.
 */
export interface RecentImport {
  id: number;
  fileName: string;
  status: ImportBatchStatus;

  /**
   * Nombre de maturités initialement insérées.
   *
   * Pour un chargement REVERSED, cette valeur reste
   * historique même si les maturités ont été retirées.
   */
  insertedRows: number;

  /**
   * Instant technique représentatif de l'opération.
   */
  occurredAt: string;

  actor: string | null;
}