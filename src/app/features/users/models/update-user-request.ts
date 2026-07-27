import { UserRole } from '../../../core/authentication/models/user-role';

/**
 * Données modifiables sur un compte existant.
 *
 * Le nom d'utilisateur reste volontairement immuable.
 */
export interface UpdateUserRequest {
  fullName: string;
  role: UserRole;
}