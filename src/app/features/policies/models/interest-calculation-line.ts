import { CalculationEventType } from './calculation-event-type';

/**
 * Étape explicative du calcul des intérêts.
 */
export interface InterestCalculationLine {
  sequence: number;
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