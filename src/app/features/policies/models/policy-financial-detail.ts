import { InterestSimulation } from './interest-simulation';
import { PolicyMaturity } from './policy-maturity';
import { PolicyPaymentHistory } from './policy-payment-history';

/**
 * Détail financier complet d'une police.
 *
 * Les montants affichés proviennent du backend.
 */
export interface PolicyFinancialDetail {
  policyNumber: string;
  clientName: string;

  maturityCount: number;
  totalMaturityAmount: number;

  firstMaturityDate: string;
  lastMaturityDate: string;
  interestEndDate: string;

  interestAccrualClosed: boolean;

  paidInterestAmount: number;
  totalPaidAmount: number;
  totalGeneratedInterestAmount: number;

  maturities: PolicyMaturity[];
  payments: PolicyPaymentHistory[];
  simulation: InterestSimulation;
}