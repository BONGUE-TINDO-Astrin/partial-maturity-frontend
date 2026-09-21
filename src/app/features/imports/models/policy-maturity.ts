/**
 * Maturité insérée par un chargement CSV.
 */
export interface PolicyMaturity {
  id: number;
  policyNumber: string;
  clientName: string;
  maturityType: string;
  maturityRank: number;
  maturityDate: string;
  maturityAmount: number;
  interestEndDate: string;
  sourceRowNumber: number;
  createdAt: string;
  createdBy: string | null;
}
