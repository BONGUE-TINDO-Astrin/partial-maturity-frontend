/**
 * Données envoyées au backend pour s'authentifier.
 */
export interface LoginRequest {
  username: string;
  password: string;
}