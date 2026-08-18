import { PaymentDetail } from './payment-detail';
import { PaymentStatus } from './payment-status';

/**
 * Paiement total retourné par le backend.
 *
 * Les montants sont uniquement affichés côté Angular.
 * Toute valeur financière de référence est recalculée
 * et persistée côté backend.
 */
export interface PaymentResponse {
  id: number;
  policyNumber: string;
  paymentDate: string;
  calculationDate: string;
  annualRate: number;
  capitalAmount: number;
  interestAmount: number;
  paidAmount: number;
  completedCycles: number;
  status: PaymentStatus;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  version: number;
  /**
  * Éligibilité calculée par le backend.
  */
  cancellable: boolean;
  cancellationBlockedReason: string | null;

  details: PaymentDetail[];
}