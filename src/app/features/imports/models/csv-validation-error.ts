/**
 * Erreur détectée pendant la validation d'un CSV.
 *
 * rowNumber vaut zéro lorsqu'il s'agit d'une erreur
 * globale concernant le fichier.
 */
export interface CsvValidationError {
  rowNumber: number;
  column: string;
  code: string;
  message: string;
}