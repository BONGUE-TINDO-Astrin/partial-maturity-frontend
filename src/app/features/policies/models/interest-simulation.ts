import { InterestCalculationLine } from './interest-calculation-line';

/**
 * Résultat complet d'une simulation financière.
 *
 * Le frontend affiche les montants reçus sans effectuer
 * de calcul financier. Le backend reste la seule source
 * de vérité.
 */
export interface InterestSimulation {
  policyNumber: string;

  /**
   * Date métier du calcul au format ISO yyyy-MM-dd.
   */
  calculationDate: string;

  /**
   * Date métier après laquelle aucun nouvel intérêt
   * n'est produit pour la police.
   */
  interestEndDate: string;

  /**
   * Indique si la date de fin des intérêts est atteinte
   * à la date du calcul.
   */
  interestAccrualClosed: boolean;

  annualRate: number;
  completedCycles: number;
  openCapital: number;
  openInterest: number;
  balance: number;
  lines: InterestCalculationLine[];
}