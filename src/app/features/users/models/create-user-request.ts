import { UserRole } from '../../../core/authentication/models/user-role';

/**
 * Données envoyées lors de la création d'un compte.
 */
export interface CreateUserRequest {
  username: string;
  fullName: string;
  role: UserRole;
  password: string;
}