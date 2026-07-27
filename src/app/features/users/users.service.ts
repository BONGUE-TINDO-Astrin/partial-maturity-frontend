import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApplicationUser } from './models/application-user';
import { ChangeUserStatusRequest } from './models/change-user-status-request';
import { CreateUserRequest } from './models/create-user-request';
import { UpdateUserRequest } from './models/update-user-request';
import { environment } from '../../../environments/environment';

/**
 * Centralise les appels HTTP liés à l'administration des comptes.
 *
 * Cette classe ne contient aucune règle d'affichage.
 * Les composants restent responsables des formulaires,
 * messages et confirmations.
 */
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
    
  private readonly usersUrl = `${environment.apiUrl}/admin/users`;

  /**
   * Retourne tous les utilisateurs classés par le backend.
   */
  getAll(): Observable<ApplicationUser[]> {
    return this.http.get<ApplicationUser[]>(
      this.usersUrl,
    );
  }

  /**
   * Crée un nouveau compte utilisateur.
   */
  create(request: CreateUserRequest,): Observable<ApplicationUser> {
    return this.http.post<ApplicationUser>(this.usersUrl,request,);
  }

  /**
   * Modifie le nom complet et le rôle d'un utilisateur.
   */
  update(userId: number, request: UpdateUserRequest,): Observable<ApplicationUser> {
    return this.http.put<ApplicationUser>(
      `${this.usersUrl}/${userId}`,
      request,
    );
  }

  /**
   * Active ou désactive un compte existant.
   */
  changeStatus(userId: number, request: ChangeUserStatusRequest,): Observable<ApplicationUser> {
    return this.http.patch<ApplicationUser>(
      `${this.usersUrl}/${userId}/status`,
      request,
    );
  }
}