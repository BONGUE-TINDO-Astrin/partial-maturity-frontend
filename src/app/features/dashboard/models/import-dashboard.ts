import { ImportBatchStatus } from '../../imports/models/import-batch-status';

/**
 * Résumé du dernier chargement CSV.
 */
export interface LatestImportDashboard {
  id: number;
  fileName: string;
  status: ImportBatchStatus;
  occurredAt: string;
  actor: string | null;
}

/**
 * Indicateurs des chargements CSV.
 */
export interface ImportDashboard {
  totalImports: number;
  importedFiles: number;
  rejectedFiles: number;
  totalInsertedRows: number;
  lastImport: LatestImportDashboard | null;
}