/**
 * Format standard des erreurs retournées par Spring Boot.
 */
export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  details?: string[];
  path?: string;
}