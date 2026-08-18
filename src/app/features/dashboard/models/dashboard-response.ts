import { DashboardMetrics } from './dashboard-metrics';
import { InterestDistribution } from './interest-distribution';
import { MonthlyPaymentStatistic } from './monthly-payment-statistic';
import { RecentImport } from './recent-import';
import { RecentPayment } from './recent-payment';

/**
 * Tableau de bord commun aux utilisateurs
 * ADMIN et COMPTABILITE.
 */
export interface DashboardResponse {
  /**
   * Date métier utilisée par les calculs financiers.
   */
  calculationDate: string;

  metrics: DashboardMetrics;

  interestDistribution: InterestDistribution;

  /**
   * Les douze derniers mois, y compris les mois
   * ne possédant aucun paiement.
   */
  monthlyPayments: MonthlyPaymentStatistic[];

  /**
   * Cinq derniers chargements, tous statuts inclus.
   */
  recentImports: RecentImport[];

  /**
   * Cinq derniers paiements PAID.
   */
  recentPayments: RecentPayment[];
}