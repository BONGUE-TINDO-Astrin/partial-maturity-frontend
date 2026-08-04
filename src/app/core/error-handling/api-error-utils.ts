import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from './api-error-response';

/**
 * Extrait l'erreur standard retournée par le backend.
 *
 * Selon la configuration HTTP, le corps de la réponse peut
 * être déjà désérialisé ou reçu sous la forme d'une chaîne JSON.
 */
export function extractApiError( error: HttpErrorResponse,): ApiErrorResponse | null {
  let responseBody: unknown = error.error;

  if (typeof responseBody === 'string') {
    try {
      responseBody = JSON.parse(responseBody);
    } catch {
      return null;
    }
  }

  if (responseBody === null || typeof responseBody !== 'object') {
    return null;
  }

  const apiError = responseBody as Partial<ApiErrorResponse>;

  /*
   * Un objet sans code ni message ne correspond pas
   * au contrat d'erreur standard de l'API.
   */
  if (typeof apiError.code !== 'string' && typeof apiError.message !== 'string') {
    return null;
  }

  return responseBody as ApiErrorResponse;
}

/**
 * Transforme une erreur HTTP en message lisible.
 *
 * Ordre de priorité :
 * 1. message métier retourné par le backend ;
 * 2. message spécifique à une indisponibilité réseau ;
 * 3. message par défaut fourni par l'écran appelant.
 */
export function resolveApiErrorMessage( error: HttpErrorResponse, fallbackMessage: string,): string {
  const apiError = extractApiError(error);

  if ( typeof apiError?.message === 'string' && apiError.message.trim() ) {
    return apiError.message;
  }

  if (error.status === 0) {
    return 'Le serveur est actuellement inaccessible.';
  }

  return fallbackMessage;
}