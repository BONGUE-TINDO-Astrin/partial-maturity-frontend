import { PolicyPaymentHistory } from './policy-payment-history';
import { InterestSimulation } from './interest-simulation';
import { PolicyMaturity } from './policy-maturity';

/**
 * Détail financier complet d'une police.
 *
 * Cette réponse alimente la popup de consultation.
 * Aucun montant n'est recalculé côté frontend.
 */
export interface PolicyFinancialDetail {
  policyNumber: string;
  maturityCount: number;
  totalMaturityAmount: number;

  /**
   * Dates métier au format ISO yyyy-MM-dd.
   */
  firstMaturityDate: string;
  lastMaturityDate: string;
  interestEndDate: string;

  interestAccrualClosed: boolean;

  /**
   * Intérêts contenus dans les paiements PAID.
   */
  paidInterestAmount: number;

  /**
   * Intérêts ouverts et déjà payés cumulés.
   */
  totalGeneratedInterestAmount: number;

  maturities: PolicyMaturity[];
  simulation: InterestSimulation;

  /**
 * Montant cumulé des paiements encore valides.
 */
totalPaidAmount: number;

/**
 * Historique léger des paiements PAID,
 * classés du plus récent au plus ancien.
 */
  payments: PolicyPaymentHistory[];
}