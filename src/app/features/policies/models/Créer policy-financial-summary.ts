/**
 * Synthèse financière d'une police affichée
 * dans la liste principale.
 *
 * Cette interface reste alignée avec
 * PolicyFinancialSummaryResponse dans le backend.
 */
export interface PolicyFinancialSummary {
  policyNumber: string;
  maturityCount: number;
  totalMaturityAmount: number;

  /**
   * Dates métier au format ISO yyyy-MM-dd.
   */
  firstMaturityDate: string;
  lastMaturityDate: string;
  interestEndDate: string;
  calculationDate: string;

  /**
   * Indique si la date de production des intérêts
   * est atteinte à la date de la synthèse.
   */
  interestAccrualClosed: boolean;

  annualRate: number;

  /**
   * Nombre total de cycles annuels appliqués
   * dans la chronologie financière.
   */
  completedCycles: number;

  /**
   * Situation actuellement ouverte.
   */
  openCapital: number;
  openInterestAmount: number;
  balance: number;

  /**
   * Intérêts contenus dans les paiements PAID
   * qui restent financièrement valides.
   */
  paidInterestAmount: number;

  /**
   * Somme des intérêts ouverts et déjà payés.
   * Cette valeur est calculée par le backend.
   */
  totalGeneratedInterestAmount: number;
}