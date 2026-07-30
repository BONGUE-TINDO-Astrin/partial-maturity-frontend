/**
 * Types de lignes apparaissant dans le détail
 * d'une simulation financière.
 */
export type CalculationEventType =
  | 'MATURITY_ADDED'
  | 'INTEREST_APPLIED'
  | 'PAYMENT_APPLIED';