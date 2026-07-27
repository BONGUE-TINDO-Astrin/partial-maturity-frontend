import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap, firstValueFrom } from 'rxjs';


import { UserRole } from './models/user-role';
import { CurrentUser } from './models/current-user';
import { LoginRequest } from './models/login-request';
import { LoginResponse } from './models/login-response';
import { environment } from '../../../environments/environment';
const ACCESS_TOKEN_KEY = 'belife_access_token';
const CURRENT_USER_KEY = 'belife_current_user';

/**
 * Gère la session utilisateur du frontend.
 *
 * Responsabilités :
 * - appeler les endpoints d'authentification ;
 * - conserver temporairement le JWT ;
 * - exposer l'utilisateur courant avec un Signal ;
 * - déterminer les droits liés au rôle ;
 * - nettoyer la session lors de la déconnexion.
 *
 * Cette classe ne vérifie pas elle-même la signature du JWT.
 * La validation du token reste sous la responsabilité du backend.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`; 

  private readonly currentUserState = signal<CurrentUser | null>(
    this.readStoredUser(),
  );

  /**
   * Utilisateur courant exposé en lecture seule.
   */
  readonly currentUser = this.currentUserState.asReadonly();

  /**
   * Indique si une session locale existe.
   */
  readonly isAuthenticated = computed(
    () => this.currentUserState() !== null && this.getAccessToken() !== null,
  );

  readonly isAdmin = computed(
    () => this.currentUserState()?.role === 'ADMIN',
  );

  readonly isAccounting = computed(
    () => this.currentUserState()?.role === 'COMPTABILITE',
  );

  /**
   * Authentifie l'utilisateur puis enregistre la session reçue.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.baseUrl}/login`,
        request,
      )
      .pipe(
        tap((response) => this.storeSession(response)),
      );
  }

  /**
   * Recharge les informations de l'utilisateur depuis le backend.
   *
   * Cet appel pourra être utilisé au démarrage de l'application
   * pour confirmer que le token stocké est toujours valide.
   */
  loadCurrentUser(): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(
        `${this.baseUrl}/me`,
      )
      .pipe(
        tap((user) => {
          this.currentUserState.set(user);
          sessionStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(user),
          );
        }),
      );
  }

  /**
   * Supprime toutes les données locales d'authentification.
   *
   * Aucun endpoint de déconnexion n'est nécessaire pour le moment,
   * car le backend utilise une authentification JWT stateless.
   */
  logout(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    this.currentUserState.set(null);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserState()?.role === role;
  }

  private storeSession(response: LoginResponse): void {
    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      response.accessToken,
    );

    sessionStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify(response.user),
    );

    this.currentUserState.set(response.user);
  }

  /**
   * Restaure l'utilisateur conservé après un rafraîchissement de page.
   *
   * Une valeur JSON invalide entraîne un nettoyage automatique
   * afin de ne pas bloquer l'application.
   */
  private readStoredUser(): CurrentUser | null {
    const storedUser = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as CurrentUser;
    } catch {
      sessionStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      return null;
    }
  }

    /**
     * Valide la session conservée au démarrage de l'application.
     *
     * Si aucun token n'est présent, aucune requête n'est effectuée.
     * Si le token est expiré ou invalide, la session locale est supprimée.
     */
    async initializeSession(): Promise<void> {
        const accessToken = this.getAccessToken();
         
        if (!accessToken) {
            this.logout();
            return;
        }
        try {
            await firstValueFrom(
            this.loadCurrentUser(),
        );
        } catch {
            this.logout();
        }
    }
}