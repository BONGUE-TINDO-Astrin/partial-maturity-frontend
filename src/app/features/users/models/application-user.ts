import { UserRole } from '../../../core/authentication/models/user-role';

/**
 * Représente un compte retourné par l'API d'administration.
 *
 * Cette interface doit rester alignée avec UserResponse
 * dans le backend Spring Boot.
 */
export interface ApplicationUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}