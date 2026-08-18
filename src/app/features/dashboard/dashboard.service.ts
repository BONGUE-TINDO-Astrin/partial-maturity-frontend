import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardResponse } from './models/dashboard-response';

/**
 * Fournit le tableau de bord commun
 * aux utilisateurs autorisés.
 *
 * Le backend reste responsable de tous les calculs
 * financiers et de l'exclusion des opérations annulées.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly dashboardUrl =
    `${environment.apiUrl}/dashboard`;

  /**
   * Retourne les indicateurs, statistiques
   * et opérations récentes.
   */
  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(
      this.dashboardUrl,
    );
  }
}