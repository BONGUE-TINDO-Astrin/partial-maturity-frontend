import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../shared/models/page-response';
import { CsvImportResponse } from './models/csv-import-response';
import { ImportBatchDetail } from './models/import-batch-detail';
import { ImportBatchSummary } from './models/import-batch-summary';
import { PolicyMaturity } from './models/policy-maturity';
import { environment } from '../../../environments/environment';

/**
 * Centralise les échanges HTTP liés aux chargements CSV.
 *
 * <p>Le service ne gère aucun état visuel. Les composants restent
 * responsables du chargement, des erreurs et des confirmations.</p>
 */
@Injectable({
  providedIn: 'root',
})
export class ImportsService {
  private readonly http = inject(HttpClient);

  private readonly importsUrl =
    `${environment.apiUrl}/admin/imports`;

  /**
   * Envoie le fichier dans une requête multipart.
   *
   * Il ne faut pas définir manuellement Content-Type :
   * le navigateur ajoute lui-même le boundary multipart.
   */
  importCsv(
    file: File,
  ): Observable<CsvImportResponse> {
    const formData = new FormData();

    formData.append(
      'file',
      file,
      file.name,
    );

    return this.http.post<CsvImportResponse>(
      `${this.importsUrl}/csv`,
      formData,
    );
  }

  /**
   * Retourne l'historique paginé des chargements.
   */
  getHistory(
    page: number,
    size: number,
  ): Observable<PageResponse<ImportBatchSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<
      PageResponse<ImportBatchSummary>
    >(
      this.importsUrl,
      { params },
    );
  }

  /**
   * Retourne le détail d'un chargement.
   */
  getDetail(
    batchId: number,
  ): Observable<ImportBatchDetail> {
    return this.http.get<ImportBatchDetail>(
      `${this.importsUrl}/${batchId}`,
    );
  }

  /**
   * Retourne les maturités insérées par le chargement.
   */
  getMaturities(
    batchId: number,
  ): Observable<PolicyMaturity[]> {
    return this.http.get<PolicyMaturity[]>(
      `${this.importsUrl}/${batchId}/maturities`,
    );
  }
}