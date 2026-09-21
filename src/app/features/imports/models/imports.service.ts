import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CsvImportResponse } from './csv-import-response';
import { ImportBatchSummary } from './import-batch-summary';
import { PageResponse } from '../../../shared/models/page-response';
import { ImportBatchDetail } from './import-batch-detail';
import { PolicyMaturity } from './policy-maturity';
import { ReverseImportBatchRequest } from './reverse-import-batch-request';


@Injectable({ providedIn: 'root' })
export class ImportsService {
  private readonly http = inject(HttpClient);
  private readonly importsUrl = `${environment.apiUrl}/imports`;

  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<CsvImportResponse>(
      `${this.importsUrl}/csv`,
      formData,
    );
  }

  getHistory(
    page: number,
    size: number,
  ): Observable<PageResponse<ImportBatchSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<ImportBatchSummary>>(
      this.importsUrl,
      { params },
    );
  }

  getDetail(batchId: number): Observable<ImportBatchDetail> {
    return this.http.get<ImportBatchDetail>(
      `${this.importsUrl}/${batchId}`,
    );
  }

  getMaturities(batchId: number): Observable<PolicyMaturity[]> {
    return this.http.get<PolicyMaturity[]>(
      `${this.importsUrl}/${batchId}/maturities`,
    );
  }

  reverseImportBatch(
    batchId: number,
    reason: string,
  ): Observable<ImportBatchDetail> {
    const request: ReverseImportBatchRequest = {
      reason: reason.trim(),
    };

    return this.http.post<ImportBatchDetail>(
      `${this.importsUrl}/${batchId}/reverse`,
      request,
    );
  }
}
