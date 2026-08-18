import { PolicyMaturity } from './policy-maturity';

/**
 * Représente la description d'une police
 * et ses maturités importées.
 *
 * Cette interface reste alignée avec
 * PolicyDetailResponse dans le backend.
 */
export interface PolicyDetail {
  policyNumber: string;
  maturityCount: number;
  totalMaturityAmount: number;

  /**
   * Dates métier au format ISO yyyy-MM-dd.
   */
  firstMaturityDate: string;
  lastMaturityDate: string;

  maturities: PolicyMaturity[];
}