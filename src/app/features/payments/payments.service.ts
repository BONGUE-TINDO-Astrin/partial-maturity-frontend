import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import {
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CancelPaymentRequest } from './models/cancel-payment-request';
import { PaymentPage } from './models/payment-page';
import { PaymentResponse } from './models/payment-response';
import { PaymentStatus } from './models/payment-status';

/**
 * Centralise les appels HTTP liés aux paiements.
 *
 * Aucun montant n'est transmis pendant l'enregistrement :
 * le backend recalcule la situation dans sa transaction.
 */
@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  /**
   * Retourne une page de paiements selon les filtres
   * actuellement sélectionnés.
   */
  searchPayments(search: string, status: PaymentStatus | null, page: number, size: number,): Observable<PaymentPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PaymentPage>(
      `${this.apiUrl}/payments`, {params},
    );
  }

  /**
   * Recalcule et enregistre le paiement total
   * de la situation courante.
   */
  recordPayment(policyNumber: string): Observable<PaymentResponse> {
    const encodedPolicyNumber = this.encodePolicyNumber(policyNumber);

    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/policies/${encodedPolicyNumber}/payments`,
      null,
    );
  }

  /**
   * Endpoint historique conservé pour les consommateurs
   * consultant directement une police.
   */
  getPolicyPayments(policyNumber: string): Observable<PaymentResponse[]> {
    const encodedPolicyNumber = this.encodePolicyNumber(policyNumber);

    return this.http.get<PaymentResponse[]>(
      `${this.apiUrl}/policies/${encodedPolicyNumber}/payments`,
    );
  }

  /**
   * Retourne un paiement avec toutes ses lignes
   * justificatives.
   */
  getPayment(paymentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(
      `${this.apiUrl}/payments/${paymentId}`,
    );
  }

  /**
   * Annule un paiement encore valide.
   */
  cancelPayment(paymentId: number, request: CancelPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/payments/${paymentId}/cancel`, request,);
  }

  private encodePolicyNumber(policyNumber: string): string {
    return encodeURIComponent(policyNumber.trim());
  }
}