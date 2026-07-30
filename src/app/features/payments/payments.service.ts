import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CancelPaymentRequest } from './models/cancel-payment-request';
import { PaymentResponse } from './models/payment-response';
import { environment } from '../../../environments/environment';

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
   * Recalcule et enregistre le paiement total
   * de la situation courante.
   */
  recordPayment(policyNumber: string,): Observable<PaymentResponse> {
    const encodedPolicyNumber = encodeURIComponent(policyNumber.trim());

    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/policies/${encodedPolicyNumber}/payments`, null,);
  }

  /**
   * Retourne l'historique complet des paiements
   * d'une police.
   */
  getPolicyPayments(policyNumber: string,): Observable<PaymentResponse[]> {
    const encodedPolicyNumber = encodeURIComponent(policyNumber.trim());

    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/policies/${encodedPolicyNumber}/payments`,);
  }

  /**
   * Retourne un paiement et ses détails.
   */
  getPayment(paymentId: number,): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/${paymentId}`,);
  }

  /**
   * Annule un paiement encore valide.
   */
  cancelPayment(paymentId: number, request: CancelPaymentRequest,): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/payments/${paymentId}/cancel`, request,);
  }
}