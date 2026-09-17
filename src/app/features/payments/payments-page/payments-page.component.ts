import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideEye,
  LucideHistory,
  LucideReceiptText,
  LucideRefreshCw,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import {
  finalize,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { CancelPaymentDialogComponent } from '../../../shared/ui-components/cancel-payment-dialog.component/cancel-payment-dialog.component';
import { PaymentDetailDialogComponent } from '../payment-detail-dialog/payment-detail-dialog.component';
import { PaymentResponse } from '../models/payment-response';
import { PaymentStatus } from '../models/payment-status';
import { PaymentSummary } from '../models/payment-summary';
import { PaymentsService } from '../payments.service';

/**
 * Liste paginée des paiements enregistrés.
 *
 * <p>Le comportement d'affichage dépend du rôle :</p>
 *
 * <ul>
 *   <li>ADMIN consulte tous les paiements et dispose
 *       de la recherche et des filtres ;</li>
 *   <li>COMPTABILITE consulte uniquement les paiements
 *       au statut PAID.</li>
 * </ul>
 *
 * <p>Cette restriction est actuellement appliquée
 * uniquement côté frontend. Le backend reste inchangé.</p>
 */
@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [
    DecimalPipe,
    LocalDatePipe,
    PaymentDetailDialogComponent,
    CancelPaymentDialogComponent,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCircleAlert,
    LucideCircleCheckBig,
    LucideEye,
    LucideHistory,
    LucideReceiptText,
    LucideRefreshCw,
    LucideSearch,
    LucideX,
  ],
  templateUrl:
    './payments-page.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PaymentsPageComponent implements OnInit {

  private readonly paymentsService = inject(PaymentsService);

  readonly authenticationService = inject(AuthenticationService);

  readonly payments = signal<PaymentSummary[]>([]);

  readonly selectedPayment = signal<PaymentResponse | null>(null);

  readonly paymentToCancel = signal<PaymentResponse | null>(null);

  readonly searchTerm = signal('');

  /**
   * Filtre librement sélectionnable uniquement
   * par un administrateur.
   *
   * Pour la comptabilité, le statut réellement envoyé
   * au backend est toujours PAID.
   */
  readonly selectedStatus = signal<PaymentStatus | null>(null);

  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly firstPage = signal(true);
  readonly lastPage = signal(true);

  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly cancelling = signal(false);

  readonly pageError = signal<string | null>(null);

  readonly detailError = signal<string | null>(null);

  readonly successMessage = signal<string | null>(null);

  readonly cancellationError = signal<string | null>(null);

  /**
   * Détermine si les outils avancés de recherche
   * et de filtrage doivent être proposés.
   */
  readonly isAdmin = computed(
    () =>
      this.authenticationService.isAdmin(),
  );

  /**
   * Statut réellement transmis au backend.
   *
   * Un comptable ne demande que les paiements PAID,
   * même si aucune valeur n'est sélectionnée dans
   * le Signal selectedStatus.
   */
  readonly effectiveStatus = computed<
    PaymentStatus | null
  >(
    () =>
      this.isAdmin()
        ? this.selectedStatus()
        : 'PAID',
  );

  /**
   * La recherche est disponible pour tous les rôles.
   * Le filtre de statut est pris en compte uniquement
   * pour l'administrateur.
   */
  readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim().length > 0 ||
      (
        this.isAdmin() &&
        this.selectedStatus() !== null
      ),
  );

  readonly hasPendingOperation = computed(
    () =>
      this.loading() ||
      this.loadingDetail() ||
      this.cancelling(),
  );

  readonly displayedPageNumber = computed(
    () =>
      this.totalPages() === 0
        ? 0
        : this.currentPage() + 1,
  );

  ngOnInit(): void {
    /*
     * Aucun besoin de modifier selectedStatus :
     * effectiveStatus impose automatiquement PAID
     * lorsque l'utilisateur est comptable.
     */
    this.loadPayments(0);
  }

  /**
   * Charge une page avec les critères autorisés
   * pour le rôle de l'utilisateur.
   */
  loadPayments(page: number): void {
    if (
      this.loading() ||
      this.cancelling()
    ) {
      return;
    }

    this.loading.set(true);
    this.pageError.set(null);

    this.paymentsService
      .searchPayments(
        this.effectiveSearchTerm(),
        this.effectiveStatus(),
        page,
        this.pageSize(),
      )
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          this.applyPage(response);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'La liste des paiements ne peut pas être chargée.',
            ),
          );
        },
      });
  }

  /**
   * Applique la recherche par numéro de police.
   *
   * Pour COMPTABILITE, le statut PAID reste imposé
   * automatiquement par effectiveStatus.
   */
  searchPayments(): void {
    this.loadPayments(0);
  }

  updateSearchTerm(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  /**
   * Change le statut uniquement pour ADMIN.
   */
  selectStatus(
    status: PaymentStatus | null,
  ): void {
    if (
      !this.isAdmin() ||
      this.selectedStatus() === status ||
      this.hasPendingOperation()
    ) {
      return;
    }

    this.selectedStatus.set(status);
    this.loadPayments(0);
  }

  /**
   * Efface la recherche pour tous les utilisateurs.
   *
   * Pour ADMIN, le statut sélectionné est également
   * réinitialisé. Pour COMPTABILITE, le statut PAID
   * reste imposé par effectiveStatus.
   */
  clearFilters(): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.searchTerm.set('');

    if (this.isAdmin()) {
      this.selectedStatus.set(null);
    }

    this.loadPayments(0);
  }

  previousPage(): void {
    if (
      !this.firstPage() &&
      !this.hasPendingOperation()
    ) {
      this.loadPayments(
        this.currentPage() - 1,
      );
    }
  }

  nextPage(): void {
    if (
      !this.lastPage() &&
      !this.hasPendingOperation()
    ) {
      this.loadPayments(
        this.currentPage() + 1,
      );
    }
  }

  /**
   * Charge les lignes justificatives uniquement
   * lorsque l'utilisateur ouvre le paiement.
   */
  openPayment(
    payment: PaymentSummary,
  ): void {
    if (this.hasPendingOperation()) {
      return;
    }

    /*
     * Protection d'affichage complémentaire.
     *
     * Normalement, un comptable ne reçoit que des
     * paiements PAID grâce à effectiveStatus.
     */
    if (
      !this.isAdmin() &&
      payment.status !== 'PAID'
    ) {
      return;
    }

    this.loadingDetail.set(true);
    this.detailError.set(null);
    this.selectedPayment.set(null);

    this.paymentsService
      .getPayment(payment.id)
      .pipe(
        finalize(() => {
          this.loadingDetail.set(false);
        }),
      )
      .subscribe({
        next: detail => {
          /*
           * Même protection sur le résultat détaillé.
           */
          if (
            !this.isAdmin() &&
            detail.status !== 'PAID'
          ) {
            this.detailError.set(
              'Ce paiement n’est pas disponible dans cette consultation.',
            );

            return;
          }

          this.selectedPayment.set(detail);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.detailError.set(
            resolveApiErrorMessage(
              error,
              'Le détail du paiement ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  closePayment(): void {
    if (
      !this.cancelling() &&
      !this.loadingDetail()
    ) {
      this.selectedPayment.set(null);
      this.detailError.set(null);
    }
  }

  /**
   * L'annulation reste réservée à COMPTABILITE.
   *
   * La réponse backend confirme également que le
   * paiement sélectionné est actuellement annulable.
   */
  requestCancellation(payment: PaymentResponse): void {
    if (
      !this.authenticationService
        .isAdmin() || payment.status !== 'PAID' || !payment.cancellable ||
      this.cancelling()
    ) {
      return;
    }

    this.cancellationError.set(null);
    this.paymentToCancel.set(payment);
  }

  closeCancellationDialog(): void {
    if (this.cancelling()) {
      return;
    }

    this.paymentToCancel.set(null);
    this.cancellationError.set(null);
  }

  /**
   * Annule le paiement puis recharge la page courante
   * et le détail depuis le backend.
   */
  confirmCancellation(reason: string): void {
    const payment = this.paymentToCancel();

    if (
      !payment ||
      !this.authenticationService
        .isAdmin() ||
      !payment.cancellable ||
      this.cancelling()
    ) {
      return;
    }

    this.cancelling.set(true);
    this.cancellationError.set(null);
    this.pageError.set(null);
    this.successMessage.set(null);

    this.paymentsService
      .cancelPayment(
        payment.id,
        {
          reason,
        },
      )
      .pipe(
        switchMap(cancelledPayment =>
          forkJoin({
            cancelledPayment:
              of(cancelledPayment),

            page:
              this.paymentsService
                .searchPayments(
                  this.effectiveSearchTerm(),
                  this.effectiveStatus(),
                  this.currentPage(),
                  this.pageSize(),
                ),

            detail:
              this.paymentsService
                .getPayment(payment.id),
          }),
        ),

        finalize(() => {
          this.cancelling.set(false);
        }),
      )
      .subscribe({
        next: ({
          cancelledPayment,
          page,
          detail,
        }) => {
          this.applyPage(page);

          /*
           * Après annulation, le comptable consulte
           * uniquement les paiements PAID. Le paiement
           * annulé disparaît donc de sa liste.
           *
           * Le détail annulé n'est pas maintenu ouvert
           * pour éviter d'afficher une opération qui
           * n'appartient plus à la consultation courante.
           */
          if (this.isAdmin()) {
            this.selectedPayment.set(detail);
          } else {
            this.selectedPayment.set(null);
          }

          this.paymentToCancel.set(null);
          this.cancellationError.set(null);

          this.successMessage.set(
            `Le paiement n° ${cancelledPayment.id} a été annulé avec succès. La situation de la police sera de nouveau prise en compte dans les simulations.`,
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.cancellationError.set(
            resolveApiErrorMessage(
              error,
              'Le paiement ne peut pas être annulé.',
            ),
          );
        },
      });
  }

  /**
   * La recherche par numéro de police est disponible
   */
  private effectiveSearchTerm(): string {
    return this.searchTerm().trim();
  }

  private applyPage(
    response: {
      content: PaymentSummary[];
      page: number;
      totalElements: number;
      totalPages: number;
      first: boolean;
      last: boolean;
    },
  ): void {
    /*
     * Le backend a normalement déjà appliqué status=PAID
     * pour COMPTABILITE. Ce filtre local est une protection
     * visuelle complémentaire, pas la source de pagination.
     */
    const visiblePayments =
      this.isAdmin()
        ? response.content
        : response.content.filter(
            payment =>
              payment.status === 'PAID',
          );

    this.payments.set(visiblePayments);
    this.currentPage.set(response.page);

    /*
     * Pour COMPTABILITE, les totaux restent cohérents,
     * car la requête backend utilisait déjà status=PAID.
     */
    this.totalElements.set(
      response.totalElements,
    );

    this.totalPages.set(
      response.totalPages,
    );

    this.firstPage.set(response.first);
    this.lastPage.set(response.last);
  }
}