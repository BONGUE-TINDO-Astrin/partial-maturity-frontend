import { ImportBatchStatus } from './import-batch-status';

/** Résumé affiché dans l'historique des chargements. */
export interface ImportBatchSummary {
  id: number;
  originalFileName: string;
  fileSizeBytes: number;
  totalRows: number;
  insertedRows: number;
  existingRows: number;
  errorRows: number;
  status: ImportBatchStatus;
  importedAt: string | null;
  importedBy: string | null;
  reversedAt: string | null;
  reversedBy: string | null;
  createdAt: string;
  createdBy: string | null;
}
