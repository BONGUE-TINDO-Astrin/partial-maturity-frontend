import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardResponse } from './models/dashboard-response';
import { environment } from '../../../environments/environment';

/**
 * Fournit les indicateurs du tableau de bord.
 *
 * Le backend détermine automatiquement les sections
 * accessibles à partir du rôle contenu dans le JWT.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly dashboardUrl = `${environment.apiUrl}/dashboard`;

  /**
   * Retourne le tableau de bord adapté au rôle connecté.
   */
  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(
      this.dashboardUrl,
    );
  }
}