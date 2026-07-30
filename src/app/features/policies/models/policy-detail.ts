import { PolicyMaturity } from './policy-maturity';

/**
 * Représente la synthèse d'une police et ses maturités.
 *
 * Cette interface doit rester alignée avec
 * PolicyDetailResponse dans le backend.
 */
export interface PolicyDetail {
  policyNumber: string;
  maturityCount: number;
  totalMaturityAmount: number;
  firstMaturityDate: string;
  lastMaturityDate: string;
  maturities: PolicyMaturity[];
}