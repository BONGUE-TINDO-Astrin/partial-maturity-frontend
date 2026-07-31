/**
 * Indicateurs relatifs aux polices et aux maturités.
 *
 * Les montants sont uniquement affichés par Angular.
 * Le backend reste responsable des calculs financiers.
 */
export interface PortfolioDashboard {
  totalPolicies: number;
  totalMaturities: number;
  totalMaturityAmount: number;
  firstMaturityDate: string | null;
  lastMaturityDate: string | null;
}