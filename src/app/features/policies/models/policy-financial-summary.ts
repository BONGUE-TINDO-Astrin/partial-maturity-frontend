/**
 * Synthèse financière d'une police affichée
 * dans la liste principale.
 */
export interface PolicyFinancialSummary {
  policyNumber: string;
  clientName: string;

  maturityCount: number;
  totalMaturityAmount: number;

  firstMaturityDate: string;
  lastMaturityDate: string;
  interestEndDate: string;
  calculationDate: string;

  interestAccrualClosed: boolean;

  annualRate: number;
  completedCycles: number;

  openCapital: number;
  openInterestAmount: number;
  paidInterestAmount: number;
  totalGeneratedInterestAmount: number;
  balance: number;
}