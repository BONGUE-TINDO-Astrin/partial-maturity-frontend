/**
 * Maturité insérée par un chargement CSV.
 *
 * Le montant est reçu sous forme de number depuis l'API.
 * Les calculs financiers resteront toujours effectués
 * côté backend avec BigDecimal.
 */
export interface PolicyMaturity {
  id: number;
  policyNumber: string;
  maturityType: string;
  maturityRank: number;
  maturityDate: string;
  maturityAmount: number;
  sourceRowNumber: number;
  createdAt: string;
  createdBy: string | null;
}