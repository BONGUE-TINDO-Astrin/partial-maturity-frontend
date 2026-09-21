import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InterestSimulation } from './models/interest-simulation';
import { PolicyDetail } from './models/policy-detail';
import { PolicyFinancialDetail } from './models/policy-financial-detail';
import { PolicyFinancialSummary } from './models/policy-financial-summary';

/**
 * Centralise les appels HTTP liés à la consultation
 * et à la simulation des polices.
 *
 * Cette classe ne contient aucune logique d'affichage.
 * Le JWT est automatiquement ajouté par
 * AuthenticationInterceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class PoliciesService {
  private readonly http = inject(HttpClient);

  private readonly policiesUrl = `${environment.apiUrl}/policies`;

  /**
   * Charge toutes les polices avec leur situation
   * financière courante.
   *
   * La recherche utilisateur sera ensuite appliquée
   * localement dans la page.
   */
  getFinancialSummaries(): Observable<PolicyFinancialSummary[]> {
    return this.http.get<PolicyFinancialSummary[]>(this.policiesUrl);
  }

  /**
   * Recherche les maturités d'une police
   * à partir de son numéro exact.
   */
  getPolicyDetails(policyNumber: string): Observable<PolicyDetail> {
    const encodedPolicyNumber = this.encodePolicyNumber(policyNumber);

    return this.http.get<PolicyDetail>(
      `${this.policiesUrl}/${encodedPolicyNumber}`,
    );
  }

  /**
   * Charge la situation financière complète
   * utilisée par la popup de consultation.
   */
  getFinancialDetails(policyNumber: string): Observable<PolicyFinancialDetail> {
    const encodedPolicyNumber = this.encodePolicyNumber(policyNumber);

    return this.http.get<PolicyFinancialDetail>(
      `${this.policiesUrl}/${encodedPolicyNumber}/financial-details`,
    );
  }

  /**
   * Calcule la situation financière d'une police
   * à la date métier obtenue par le backend.
   *
   * Cet endpoint reste utile après l'enregistrement
   * d'un paiement ou pour un recalcul ponctuel.
   */
  simulate(policyNumber: string): Observable<InterestSimulation> {
    const encodedPolicyNumber = this.encodePolicyNumber(policyNumber);

    return this.http.get<InterestSimulation>(
      `${this.policiesUrl}/${encodedPolicyNumber}/simulation`,
    );
  }

  /**
   * Prépare un numéro de police pour son utilisation
   * dans un segment d'URL.
   */
  private encodePolicyNumber(policyNumber: string): string {
    return encodeURIComponent(
      policyNumber.trim(),
    );
  }
}