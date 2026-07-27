import { UserRole } from './user-role';

/**
 * Représente l'utilisateur actuellement authentifié.
 *
 * Cette structure doit rester alignée avec CurrentUserResponse
 * côté Spring Boot.
 */
export interface CurrentUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}