import { PaymentStatus } from './payment-status';

/**
 * Paiement léger retourné dans la liste paginée.
 *
 * Les lignes justificatives sont chargées uniquement
 * lors de l'ouverture du détail.
 */
export interface PaymentSummary {
  id: number;
  policyNumber: string;

  /**
   * Dates métier au format ISO yyyy-MM-dd.
   */
  paymentDate: string;
  calculationDate: string;

  annualRate: number;
  capitalAmount: number;
  interestAmount: number;
  paidAmount: number;
  completedCycles: number;
  status: PaymentStatus;

  /**
   * Instants techniques au format ISO avec fuseau.
   */
  cancelledAt: string | null;
  createdAt: string;
  createdBy: string | null;
}