/**
 * Paiement PAID récent affiché sur le dashboard.
 */
export interface RecentPayment {
  id: number;
  policyNumber: string;

  /**
   * Date métier au format ISO yyyy-MM-dd.
   */
  paymentDate: string;

  capitalAmount: number;
  interestAmount: number;
  paidAmount: number;
  createdBy: string | null;
}