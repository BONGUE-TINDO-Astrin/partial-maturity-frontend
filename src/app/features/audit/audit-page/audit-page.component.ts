import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleUserRound,
  LucideEraser,
  LucideEye,
  LucideFileInput,
  LucideFilter,
  LucideReceiptText,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuditDetailDialogComponent } from '../audit-detail-dialog/audit-detail-dialog.component';
import { AuditService } from '../audit.service';
import { AuditEventType } from '../models/audit-event-type';
import { AuditLogDetail } from '../models/audit-log-detail';
import { AuditLogSummary } from '../models/audit-log-summary';
import { AuditResourceType } from '../models/audit-resource-type';
import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';
interface AuditFilterOption<T> {
  value: T;
  label: string;
}

/**
 * Page d'administration du journal d'audit.
 */
@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AuditDetailDialogComponent,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCircleAlert,
    LucideCircleUserRound,
    LucideEraser,
    LucideEye,
    LucideFileInput,
    LucideFilter,
    LucideReceiptText,
    LucideRefreshCw,
    LucideSearch,
    LucideShieldCheck,
  ],
  templateUrl: './audit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auditService = inject(AuditService);

  readonly eventTypes: ReadonlyArray<
    AuditFilterOption<AuditEventType>
  > = [
    { value: 'USER_CREATED', label: 'Utilisateur créé' },
    { value: 'USER_UPDATED', label: 'Utilisateur modifié' },
    { value: 'USER_ACTIVATED', label: 'Utilisateur activé' },
    { value: 'USER_DEACTIVATED', label: 'Utilisateur désactivé' },
    { value: 'FILE_IMPORTED', label: 'Fichier importé' },
    { value: 'FILE_REJECTED', label: 'Fichier rejeté' },
    { value: 'PAYMENT_RECORDED', label: 'Paiement enregistré' },
    { value: 'PAYMENT_CANCELLED', label: 'Paiement annulé' },
  ];

  readonly resourceTypes: ReadonlyArray<
    AuditFilterOption<AuditResourceType>
  > = [
    { value: 'USER', label: 'Utilisateur' },
    { value: 'IMPORT_BATCH', label: 'Lot d’importation' },
    { value: 'PAYMENT', label: 'Paiement' },
  ];

  readonly filterForm = this.formBuilder.nonNullable.group({
    eventType: [''],
    resourceType: [''],
    actorUsername: [''],
    policyNumber: [''],
    fromDate: [''],
    toDate: [''],
  });

  readonly audits = signal<AuditLogSummary[]>([]);
  readonly selectedAudit = signal<AuditLogDetail | null>(null);

  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly pageError = signal<string | null>(null);

  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly firstPage = signal(true);
  readonly lastPage = signal(true);

  ngOnInit(): void {
    this.loadAudits(0);
  }

  applyFilters(): void {
    if (this.loading()) {
      return;
    }

    this.pageError.set(null);
    const values = this.filterForm.getRawValue();

    if (
      values.fromDate &&
      values.toDate &&
      values.fromDate > values.toDate
    ) {
      this.pageError.set(
        'La date de début ne peut pas être postérieure à la date de fin.',
      );
      return;
    }

    this.loadAudits(0);
  }

  clearFilters(): void {
    if (this.loading()) {
      return;
    }

    this.filterForm.reset({
      eventType: '',
      resourceType: '',
      actorUsername: '',
      policyNumber: '',
      fromDate: '',
      toDate: '',
    });

    this.pageError.set(null);
    this.loadAudits(0);
  }

  loadAudits(page: number): void {
    if (this.loading()) {
      return;
    }

    const values = this.filterForm.getRawValue();

    this.loading.set(true);
    this.pageError.set(null);

    this.auditService
      .search({
        page,
        size: this.pageSize(),
        eventType: values.eventType
          ? (values.eventType as AuditEventType)
          : undefined,
        resourceType: values.resourceType
          ? (values.resourceType as AuditResourceType)
          : undefined,
        actorUsername: values.actorUsername.trim() || undefined,
        policyNumber: values.policyNumber.trim() || undefined,
        fromDate: values.fromDate || undefined,
        toDate: values.toDate || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.audits.set(response.content);
          this.currentPage.set(response.page);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
          this.firstPage.set(response.first);
          this.lastPage.set(response.last);
        },
        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'Le journal d’audit ne peut pas être chargé.',
            ),
          );
        }
      });
  }

  refresh(): void {
    this.loadAudits(this.currentPage());
  }

  previousPage(): void {
    if (!this.firstPage() && !this.loading()) {
      this.loadAudits(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (!this.lastPage() && !this.loading()) {
      this.loadAudits(this.currentPage() + 1);
    }
  }

  openDetail(audit: AuditLogSummary): void {
    if (this.loadingDetail()) {
      return;
    }

    this.loadingDetail.set(true);
    this.pageError.set(null);

    this.auditService
      .getDetail(audit.id)
      .pipe(finalize(() => this.loadingDetail.set(false)))
      .subscribe({
        next: (detail) => this.selectedAudit.set(detail),
        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'Le détail de l’événement d’audit ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  closeDetail(): void {
    if (!this.loadingDetail()) {
      this.selectedAudit.set(null);
    }
  }

  eventLabel(eventType: AuditEventType): string {
    return (
      this.eventTypes.find((item) => item.value === eventType)?.label ??
      eventType
    );
  }

  resourceLabel(resourceType: AuditResourceType): string {
    return (
      this.resourceTypes.find((item) => item.value === resourceType)?.label ??
      resourceType
    );
  }

  isUserEvent(eventType: AuditEventType): boolean {
    return eventType.startsWith('USER_');
  }

  isFileEvent(eventType: AuditEventType): boolean {
    return eventType.startsWith('FILE_');
  }

  isPaymentEvent(eventType: AuditEventType): boolean {
    return eventType.startsWith('PAYMENT_');
  }

  isNegativeEvent(eventType: AuditEventType): boolean {
    return (
      eventType === 'USER_DEACTIVATED' ||
      eventType === 'FILE_REJECTED' ||
      eventType === 'PAYMENT_CANCELLED'
    );
  }

}
