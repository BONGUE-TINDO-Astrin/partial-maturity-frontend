/**
 * Représente une maturité appartenant à une police.
 *
 * Cette interface reste alignée avec
 * PolicyMaturityResponse dans le backend Spring Boot.
 *
 * Les montants reçus sont uniquement utilisés pour
 * l'affichage. Aucun calcul financier n'est réalisé
 * dans le frontend.
 */
export interface PolicyMaturity {
  id: number;
  policyNumber: string;
  maturityType: string;
  maturityRank: number;

  /**
   * Date métier au format ISO yyyy-MM-dd.
   */
  maturityDate: string;

  maturityAmount: number;

  /**
   * Date métier commune aux maturités de la police.
   * Aucun nouvel intérêt n'est produit après cette date.
   */
  interestEndDate: string;

  sourceRowNumber: number;
  createdAt: string;
  createdBy: string | null;
}