import { CsvValidationError } from './csv-validation-error';
import { ImportBatchStatus } from './import-batch-status';

/** Détail complet d'un chargement CSV. */
export interface ImportBatchDetail {
  id: number;
  originalFileName: string;
  fileSha256: string;
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
  reversalReason: string | null;
  reversible: boolean;
  reversalBlockedReason: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  errors: CsvValidationError[];
}
