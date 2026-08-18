/**
 * Indicateurs essentiels du tableau de bord.
 *
 * Les montants sont calculés par le backend et sont
 * uniquement utilisés pour l'affichage dans Angular.
 */
export interface DashboardMetrics {
  /**
   * Nombre de polices possédant au moins
   * une maturité active.
   */
  totalPolicies: number;

  /**
   * Nombre de maturités actuellement actives.
   */
  totalMaturities: number;

  /**
   * Montant nominal cumulé des maturités.
   */
  totalMaturityAmount: number;

  /**
   * Intérêts ouverts et déjà payés cumulés.
   */
  totalGeneratedInterest: number;

  /**
   * Intérêts contenus dans les paiements PAID.
   */
  totalPaidInterest: number;

  /**
   * Capital et intérêts contenus dans
   * les paiements PAID.
   */
  totalPaidAmount: number;
}