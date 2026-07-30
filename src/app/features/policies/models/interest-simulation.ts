import { InterestCalculationLine } from './interest-calculation-line';

/**
 * Résultat complet d'une simulation financière.
 *
 * Le frontend affiche les montants ; le backend reste
 * la seule source de vérité du calcul.
 */
export interface InterestSimulation {
  policyNumber: string;
  calculationDate: string;
  annualRate: number;
  completedCycles: number;
  openCapital: number;
  openInterest: number;
  balance: number;
  lines: InterestCalculationLine[];
}