/** Erreur détectée pendant la validation d'un CSV. */
export interface CsvValidationError {
  rowNumber: number;
  column: string;
  code: string;
  message: string;
}
