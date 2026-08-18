/**
 * Agrégation mensuelle des paiements valides.
 */
export interface MonthlyPaymentStatistic {
  /**
   * Mois au format yyyy-MM.
   */
  month: string;

  /**
   * Nombre de paiements PAID du mois.
   */
  paymentCount: number;

  /**
   * Montant total payé pendant le mois.
   */
  paidAmount: number;

  /**
   * Intérêts inclus dans les paiements du mois.
   */
  interestAmount: number;
}