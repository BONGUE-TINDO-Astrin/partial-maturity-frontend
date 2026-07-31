import { AdministrationDashboard } from './administration-dashboard';
import { AuditDashboard } from './audit-dashboard';
import { ImportDashboard } from './import-dashboard';
import { PaymentDashboard } from './payment-dashboard';
import { PortfolioDashboard } from './portfolio-dashboard';

/**
 * Tableau de bord adapté au rôle connecté.
 *
 * ADMIN reçoit :
 * - administration ;
 * - imports ;
 * - audit.
 *
 * COMPTABILITE reçoit :
 * - portefeuille ;
 * - paiements.
 */
export interface DashboardResponse {
  generatedAt: string;
  role: 'ADMIN' | 'COMPTABILITE';
  administration: AdministrationDashboard | null;
  imports: ImportDashboard | null;
  audit: AuditDashboard | null;
  portfolio: PortfolioDashboard | null;
  payments: PaymentDashboard | null;
}