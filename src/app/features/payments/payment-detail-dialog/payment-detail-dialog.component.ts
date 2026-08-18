import {
  DatePipe,
  DecimalPipe,
  PercentPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  LucideBan,
  LucideCircleCheckBig,
  LucideReceiptText,
  LucideX,
} from '@lucide/angular';

import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { PaymentResponse } from '../models/payment-response';

/**
 * Présente un paiement et les étapes financières
 * conservées lors de son enregistrement.
 *
 * Le composant ne réalise aucun appel HTTP.
 * L'éligibilité à l'annulation est calculée par le backend.
 */
@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    LocalDatePipe,
    DecimalPipe,
    PercentPipe,
    LucideBan,
    LucideCircleCheckBig,
    LucideReceiptText,
    LucideX,
  ],
  templateUrl:
    './payment-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailDialogComponent {
  /**
   * Paiement complet avec ses lignes justificatives
   * et son éligibilité actuelle à l'annulation.
   */
  readonly payment = input.required<PaymentResponse>();

  /**
   * Autorisation de l'utilisateur courant.
   *
   * La page parente calcule cette valeur à partir
   * du rôle COMPTABILITE.
   */
  readonly canCancel = input(false);

  /**
   * Indique qu'une annulation est actuellement
   * exécutée par le composant parent.
   */
  readonly cancelling = input(false);

  readonly closeDialog = output<void>();

  /**
   * Demande au composant parent d'ouvrir
   * le dialogue de confirmation d'annulation.
   */
  readonly requestCancellation = output<PaymentResponse>();

  /**
   * L'action est disponible uniquement lorsque :
   *
   * - l'utilisateur possède l'autorisation ;
   * - le paiement est encore au statut PAID ;
   * - le backend confirme qu'il s'agit du paiement
   *   PAID le plus récent de la police ;
   * - aucune annulation n'est déjà en cours.
   */
  readonly cancellationAvailable = computed(
    () =>
      this.canCancel() &&
      this.payment().status === 'PAID' &&
      this.payment().cancellable &&
      !this.cancelling(),
  );

  /**
   * Indique si une explication métier doit être
   * présentée à la place du bouton d'annulation.
   */
  readonly cancellationBlocked = computed(
    () =>
      this.canCancel() &&
      this.payment().status === 'PAID' &&
      !this.payment().cancellable &&
      Boolean(
        this.payment()
          .cancellationBlockedReason,
      ),
  );

  close(): void {
    if (!this.cancelling()) {
      this.closeDialog.emit();
    }
  }

  /**
   * Transmet le paiement au parent uniquement
   * lorsque toutes les conditions sont encore réunies.
   *
   * Le backend refera le contrôle sous verrou lors
   * de l'annulation effective.
   */
  cancelPayment(): void {
    if (!this.cancellationAvailable()) {
      return;
    }

    this.requestCancellation.emit(
      this.payment(),
    );
  }
}