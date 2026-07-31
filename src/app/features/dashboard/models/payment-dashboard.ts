import { PaymentStatus } from '../../payments/models/payment-status';

/**
 * Résumé du dernier paiement enregistré.
 */
export interface LatestPaymentDashboard {
  id: number;
  policyNumber: string;
  paymentDate: string;
  paidAmount: number;
  status: PaymentStatus;
  createdBy: string | null;
}

/**
 * Indicateurs relatifs aux paiements.
 */
export interface PaymentDashboard {
  totalPayments: number;
  paidPayments: number;
  cancelledPayments: number;
  totalPaidAmount: number;
  lastPayment: LatestPaymentDashboard | null;
}