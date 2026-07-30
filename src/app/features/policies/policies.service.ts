import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PolicyDetail } from './models/policy-detail';
import { environment } from '../../../environments/environment';
import { InterestSimulation } from './models/interest-simulation';

/**
 * Centralise les appels HTTP liés à la consultation des polices.
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
   * Recherche une police par son numéro exact.
   *
   * encodeURIComponent protège l'URL lorsque le numéro
   * contient des caractères devant être encodés.
   *
   * @param policyNumber numéro de police recherché
   */
  getPolicyDetails(policyNumber: string,): Observable<PolicyDetail> {
    const encodedPolicyNumber = encodeURIComponent(policyNumber.trim());

    return this.http.get<PolicyDetail>(
      `${this.policiesUrl}/${encodedPolicyNumber}`,
    );
  }

    /**
     * Calcule la situation financière de la police
     * à la date métier obtenue par le backend.
     */
    simulate(policyNumber: string,): Observable<InterestSimulation> {
        const encodedPolicyNumber = encodeURIComponent(policyNumber.trim());

        return this.http.get<InterestSimulation>(
            `${this.policiesUrl}/${encodedPolicyNumber}/simulation`,
        );
    }

}