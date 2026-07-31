import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../shared/models/page-response';
import { AuditLogDetail } from './models/audit-log-detail';
import { AuditLogSummary } from './models/audit-log-summary';
import { AuditSearchCriteria } from './models/audit-search-criteria';
import { environment } from '../../../environments/environment';

/**
 * Centralise les appels HTTP liés au journal d'audit.
 *
 * Le journal est accessible uniquement au rôle ADMIN.
 */
@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);

  private readonly auditUrl = `${environment.apiUrl}/admin/audit`;

  /**
   * Recherche les événements avec pagination et filtres.
   */
  search(criteria: AuditSearchCriteria,): Observable<PageResponse<AuditLogSummary>> {
    let params = new HttpParams()
      .set('page', criteria.page)
      .set('size', criteria.size);

    if (criteria.eventType) {
      params = params.set(
        'eventType',
        criteria.eventType,
      );
    }

    if (criteria.resourceType) {
      params = params.set(
        'resourceType',
        criteria.resourceType,
      );
    }

    if (criteria.actorUsername?.trim()) {
      params = params.set(
        'actorUsername',
        criteria.actorUsername.trim(),
      );
    }

    if (criteria.policyNumber?.trim()) {
      params = params.set(
        'policyNumber',
        criteria.policyNumber.trim(),
      );
    }

    if (criteria.fromDate) {
      params = params.set(
        'fromDate',
        criteria.fromDate,
      );
    }

    if (criteria.toDate) {
      params = params.set(
        'toDate',
        criteria.toDate,
      );
    }

    return this.http.get<
      PageResponse<AuditLogSummary>
    >(
      this.auditUrl,
      { params },
    );
  }

  /**
   * Retourne le détail structuré d'un événement.
   */
  getDetail(auditId: number,): Observable<AuditLogDetail> {
    return this.http.get<AuditLogDetail>(`${this.auditUrl}/${auditId}`,);
  }
}