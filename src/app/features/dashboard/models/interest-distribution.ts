/**
 * Répartition des intérêts générés.
 *
 * Le pourcentage est déjà calculé par le backend
 * et est compris entre 0 et 100.
 */
export interface InterestDistribution {
  /**
   * Intérêts actuellement ouverts.
   */
  openInterest: number;

  /**
   * Intérêts contenus dans les paiements PAID.
   */
  paidInterest: number;

  /**
   * Somme des intérêts ouverts et payés.
   */
  generatedInterest: number;

  /**
   * Pourcentage des intérêts générés déjà payés.
   *
   * Exemple :
   * 41.25 représente 41,25 %.
   */
  paidPercentage: number;
}