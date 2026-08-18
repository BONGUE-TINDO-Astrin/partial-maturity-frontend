import { PaymentSummary } from './payment-summary';

/**
 * Format paginé stable retourné par le backend.
 */
export interface PaymentPage {
  content: PaymentSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}