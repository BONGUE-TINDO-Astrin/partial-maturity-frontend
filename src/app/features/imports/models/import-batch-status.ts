/**
 * États possibles d'un chargement CSV.
 */
export type ImportBatchStatus =
  | 'PROCESSING'
  | 'IMPORTED'
  | 'REJECTED'
  | 'REVERSED'
  ;