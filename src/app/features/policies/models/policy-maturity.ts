/**
 * Représente une maturité appartenant à une police.
 *
 * Cette interface doit rester alignée avec
 * PolicyMaturityResponse dans le backend Spring Boot.
 *
 * Les calculs financiers ne doivent jamais être effectués
 * avec le type number côté frontend. Les montants reçus
 * sont uniquement utilisés pour l'affichage.
 */
export interface PolicyMaturity {
  id: number;
  policyNumber: string;
  maturityType: string;
  maturityRank: number;
  maturityDate: string;
  maturityAmount: number;
  sourceRowNumber: number;
  createdAt: string;
  createdBy: string | null;
}