/**
 * Paiement valide utilisé dans l'historique
 * financier d'une police.
 *
 * Les lignes justificatives sont chargées uniquement
 * lorsque l'utilisateur sélectionne le paiement.
 */
export interface PolicyPaymentHistory {
  id: number;
  paymentDate: string;
  capitalAmount: number;
  interestAmount: number;
  paidAmount: number;
  completedCycles: number;
}