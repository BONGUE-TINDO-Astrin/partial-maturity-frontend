import { CurrentUser } from './current-user';

/**
 * Réponse retournée par POST /api/v1/auth/login.
 */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}