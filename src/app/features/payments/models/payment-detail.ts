import { CalculationEventType } from '../../policies/models/calculation-event-type';

/**
 * Étape du calcul conservée lors de l'enregistrement
 * d'un paiement.
 */
export interface PaymentDetail {
  id: number;
  sequenceNumber: number;
  eventDate: string;
  eventType: CalculationEventType;
  description: string;
  cycleNumber: number | null;
  balanceBefore: number;
  capitalAdded: number;
  annualRate: number | null;
  interestAmount: number;
  paidAmount: number;
  balanceAfter: number;
}