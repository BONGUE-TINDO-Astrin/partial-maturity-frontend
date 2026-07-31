import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  LucideCircleUserRound,
  LucideFileInput,
  LucideReceiptText,
  LucideShieldCheck,
  LucideX,
} from '@lucide/angular';

import { AuditEventType } from '../models/audit-event-type';
import { AuditLogDetail } from '../models/audit-log-detail';
import { AuditResourceType } from '../models/audit-resource-type';

const EVENT_LABELS: Record<AuditEventType, string> = {
  USER_CREATED: 'Utilisateur créé',
  USER_UPDATED: 'Utilisateur modifié',
  USER_ACTIVATED: 'Utilisateur activé',
  USER_DEACTIVATED: 'Utilisateur désactivé',
  FILE_IMPORTED: 'Fichier importé',
  FILE_REJECTED: 'Fichier rejeté',
  PAYMENT_RECORDED: 'Paiement enregistré',
  PAYMENT_CANCELLED: 'Paiement annulé',
};

const RESOURCE_LABELS: Record<AuditResourceType, string> = {
  USER: 'Utilisateur',
  IMPORT_BATCH: 'Lot d’importation',
  PAYMENT: 'Paiement',
};

const DETAIL_LABELS: Record<string, string> = {
  userId: 'Identifiant utilisateur',
  username: 'Nom d’utilisateur',
  fullName: 'Nom complet',
  previousFullName: 'Ancien nom complet',
  newFullName: 'Nouveau nom complet',
  role: 'Rôle',
  previousRole: 'Ancien rôle',
  newRole: 'Nouveau rôle',
  active: 'Compte actif',
  batchId: 'Identifiant du lot',
  fileName: 'Nom du fichier',
  fileSha256: 'Empreinte SHA-256',
  fileSizeBytes: 'Taille du fichier',
  totalRows: 'Lignes analysées',
  insertedRows: 'Lignes insérées',
  existingRows: 'Lignes existantes',
  errorRows: 'Lignes en erreur',
  errorCount: 'Nombre d’erreurs',
  errorCodes: 'Codes d’erreur',
  paymentId: 'Identifiant du paiement',
  policyNumber: 'Numéro de police',
  paymentDate: 'Date du paiement',
  calculationDate: 'Date du calcul',
  annualRate: 'Taux annuel',
  capitalAmount: 'Capital',
  interestAmount: 'Intérêts',
  paidAmount: 'Montant payé',
  completedCycles: 'Cycles appliqués',
  status: 'Statut',
  previousStatus: 'Ancien statut',
  newStatus: 'Nouveau statut',
  cancelledAt: 'Date d’annulation',
  cancelledBy: 'Annulé par',
  cancellationReason: 'Motif d’annulation',
};

/**
 * Affiche toutes les informations d'une entrée d'audit.
 * Le composant ne réalise aucun appel HTTP.
 */
@Component({
  selector: 'app-audit-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    LucideCircleUserRound,
    LucideFileInput,
    LucideReceiptText,
    LucideShieldCheck,
    LucideX,
  ],
  templateUrl: './audit-detail-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDetailDialogComponent {
  readonly audit = input.required<AuditLogDetail>();
  readonly closeDialog = output<void>();

  readonly detailEntries = computed(() =>
    Object.entries(this.audit().details ?? {}),
  );

  close(): void {
    this.closeDialog.emit();
  }

  eventLabel(eventType: AuditEventType): string {
    return EVENT_LABELS[eventType];
  }

  resourceLabel(resourceType: AuditResourceType): string {
    return RESOURCE_LABELS[resourceType];
  }

  detailLabel(key: string): string {
    return DETAIL_LABELS[key] ?? key;
  }

  formatDetailValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }
}
