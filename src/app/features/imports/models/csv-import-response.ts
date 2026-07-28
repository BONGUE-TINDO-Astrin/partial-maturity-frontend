import { CsvValidationError } from './csv-validation-error';
import { ImportBatchStatus } from './import-batch-status';

/**
 * Rapport retourné après le traitement d'un CSV.
 */
export interface CsvImportResponse {
  batchId: number;
  fileName: string;
  status: ImportBatchStatus;
  totalRows: number;
  insertedRows: number;
  existingRows: number;
  errorRows: number;
  processedAt: string;
  errors: CsvValidationError[];
}