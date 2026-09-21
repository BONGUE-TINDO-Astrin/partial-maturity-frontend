/**
 * Représente une maturité appartenant à une police.
 */
export interface PolicyMaturity {
  id: number;
  policyNumber: string;
  clientName: string;

  /**
   * Type généré automatiquement par le backend
   * à partir du rang définitif.
   *
   * Exemples :
   * MATURITE_1, MATURITE_2, MATURITE_12.
   */
  maturityType: string;

  /**
   * Rang attribué automatiquement par le backend
   * selon les maturités déjà enregistrées.
   */
  maturityRank: number;
  maturityDate: string;
  maturityAmount: number;

  /**
   * Date métier commune aux maturités de la police.
   * Aucun nouvel intérêt n'est produit après cette date.
   */
  interestEndDate: string;

  /**
   * Numéro de la ligne d'origine dans le fichier CSV.
   */
  sourceRowNumber: number;
  createdAt: string;
  createdBy: string | null;
}