import { CalculationEventType } from './calculation-event-type';

/**
 * Étape explicative de la chronologie financière.
 *
 * Chaque ligne représente l'ajout d'une maturité,
 * l'application d'un cycle annuel ou un paiement total.
 */
export interface InterestCalculationLine {
  sequence: number;

  /**
   * Date métier de l'événement au format ISO yyyy-MM-dd.
   */
  eventDate: string;

  eventType: CalculationEventType;
  description: string;

  /**
   * Numéro du cycle annuel.
   * La valeur est absente pour une maturité ou un paiement.
   */
  cycleNumber: number | null;

  balanceBefore: number;
  capitalAdded: number;

  /**
   * Taux appliqué à cette ligne.
   * La valeur est absente hors cycle d'intérêt.
   */
  annualRate: number | null;

  interestAmount: number;

  /**
   * Montant réellement enregistré pour un paiement.
   * La valeur est nulle financièrement hors paiement.
   */
  paidAmount: number;

  balanceAfter: number;
}