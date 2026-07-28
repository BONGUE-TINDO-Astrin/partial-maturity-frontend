import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';
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
  LucideCircleCheckBig,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCloudUpload,
  LucideFileSearch,
  LucideFileUp,
  LucideHistory,
  LucideRefreshCw,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';
import {
  finalize,
  forkJoin,
} from 'rxjs';

import { ApiErrorResponse } from '../../../core/error-handling/api-error-response';
import { ImportDetailDialogComponent } from '../import-detail-dialog/import-detail-dialog.component';
import { ImportsService } from '../imports.service';
import { CsvImportResponse } from '../models/csv-import-response';
import { ImportBatchDetail } from '../models/import-batch-detail';
import { ImportBatchSummary } from '../models/import-batch-summary';
import { PolicyMaturity } from '../models/policy-maturity';

/**
 * Écran principal des chargements CSV.
 *
 * Responsabilités :
 * - sélectionner et contrôler localement un fichier ;
 * - envoyer le CSV au backend ;
 * - présenter le rapport d'importation ou de rejet ;
 * - consulter l'historique paginé ;
 * - afficher le détail d'un chargement ;
 * - afficher les maturités insérées.
 *
 * Les validations effectuées dans ce composant améliorent
 * l'expérience utilisateur. Le backend reste responsable
 * de toutes les validations définitives.
 */
@Component({
  selector: 'app-imports-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ImportDetailDialogComponent,
    LucideCircleCheckBig,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCloudUpload,
    LucideFileSearch,
    LucideFileUp,
    LucideHistory,
    LucideRefreshCw,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './imports-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportsPageComponent implements OnInit {
  /**
   * Taille maximale autorisée par le frontend : 10 Mo.
   *
   * La même limite doit également être appliquée côté backend.
   */
  private static readonly MAXIMUM_FILE_SIZE =
    10 * 1024 * 1024;

  private readonly importsService =
    inject(ImportsService);

  readonly selectedFile = signal<File | null>(null);
  readonly dragActive = signal(false);

  readonly importing = signal(false);
  readonly loadingHistory = signal(false);
  readonly loadingDetail = signal(false);
  readonly loadingMaturities = signal(false);

  readonly pageError = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  /**
   * Dernier rapport retourné par le backend.
   *
   * Il peut représenter :
   * - une importation réussie avec HTTP 201 ;
   * - un rejet métier avec HTTP 422.
   */
  readonly lastImportResult =
    signal<CsvImportResponse | null>(null);

  readonly history = signal<ImportBatchSummary[]>([]);

  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly firstPage = signal(true);
  readonly lastPage = signal(true);

  readonly selectedDetail =
    signal<ImportBatchDetail | null>(null);

  readonly selectedMaturities =
    signal<PolicyMaturity[]>([]);

  /**
   * Le bouton est actif uniquement lorsqu'un fichier
   * correctement présélectionné est disponible.
   */
  readonly canImport = computed(
    () =>
      this.selectedFile() !== null &&
      this.fileError() === null &&
      !this.importing(),
  );

  ngOnInit(): void {
    this.loadHistory(0);
  }

  /**
   * Traite une sélection effectuée avec l'explorateur de fichiers.
   */
  selectFile(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.item(0) ?? null;

    this.setSelectedFile(file);

    /*
     * Permet de sélectionner une seconde fois le même fichier
     * après son retrait ou après une première importation.
     */
    input.value = '';
  }

  /**
   * Active l'apparence de la zone de dépôt.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (!this.importing()) {
      this.dragActive.set(true);
    }
  }

  /**
   * Restaure l'apparence normale lorsque le fichier
   * quitte la zone de dépôt.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  /**
   * Récupère le premier fichier déposé dans la zone.
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);

    if (this.importing()) {
      return;
    }

    const file =
      event.dataTransfer?.files.item(0) ?? null;

    this.setSelectedFile(file);
  }

  /**
   * Retire le fichier actuellement sélectionné.
   */
  removeSelectedFile(): void {
    if (this.importing()) {
      return;
    }

    this.selectedFile.set(null);
    this.fileError.set(null);
  }

  /**
   * Envoie le fichier sélectionné au backend.
   *
   * Un statut HTTP 422 est un rejet métier du fichier.
   * Le rapport retourné est donc affiché à l'utilisateur
   * au lieu d'être présenté comme une panne technique.
   */
  importCsv(): void {
    const file = this.selectedFile();

    if (!file || !this.canImport()) {
      return;
    }

    this.importing.set(true);
    this.pageError.set(null);
    this.fileError.set(null);
    this.lastImportResult.set(null);

    this.importsService
      .importCsv(file)
      .pipe(
        finalize(() => {
          this.importing.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          this.displayImportResult(result);
        },

        error: (error: HttpErrorResponse) => {
          const rejectedImport =
            this.extractRejectedImport(error);

          if (rejectedImport) {
            this.displayImportResult(
              rejectedImport,
            );
            return;
          }

          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  /**
   * Charge une page de l'historique.
   *
   * Cette méthode ne supprime pas le dernier rapport affiché.
   */
  loadHistory(page: number): void {
    this.loadingHistory.set(true);

    this.importsService
      .getHistory(page, this.pageSize())
      .pipe(
        finalize(() => {
          this.loadingHistory.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.history.set(response.content);
          this.currentPage.set(response.page);
          this.totalElements.set(
            response.totalElements,
          );
          this.totalPages.set(
            response.totalPages,
          );
          this.firstPage.set(response.first);
          this.lastPage.set(response.last);
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  previousPage(): void {
    if (this.firstPage()) {
      return;
    }

    this.loadHistory(
      this.currentPage() - 1,
    );
  }

  nextPage(): void {
    if (this.lastPage()) {
      return;
    }

    this.loadHistory(
      this.currentPage() + 1,
    );
  }

  /**
   * Charge le détail d'un lot.
   *
   * Pour un lot importé, le détail et les maturités
   * sont chargés en parallèle.
   *
   * Pour un lot rejeté, seul le détail est nécessaire.
   */
  openDetail(
    batch: ImportBatchSummary,
  ): void {
    this.loadingDetail.set(true);
    this.pageError.set(null);
    this.selectedDetail.set(null);
    this.selectedMaturities.set([]);

    if (batch.status === 'IMPORTED') {
      this.loadingMaturities.set(true);

      forkJoin({
        detail: this.importsService.getDetail(
          batch.id,
        ),

        maturities:
          this.importsService.getMaturities(
            batch.id,
          ),
      })
        .pipe(
          finalize(() => {
            this.loadingDetail.set(false);
            this.loadingMaturities.set(false);
          }),
        )
        .subscribe({
          next: ({ detail, maturities }) => {
            this.selectedDetail.set(detail);
            this.selectedMaturities.set(
              maturities,
            );
          },

          error: (error: HttpErrorResponse) => {
            this.pageError.set(
              this.resolveErrorMessage(error),
            );
          },
        });

      return;
    }

    this.importsService
      .getDetail(batch.id)
      .pipe(
        finalize(() => {
          this.loadingDetail.set(false);
        }),
      )
      .subscribe({
        next: (detail) => {
          this.selectedDetail.set(detail);
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            this.resolveErrorMessage(error),
          );
        },
      });
  }

  /**
   * Ferme la fenêtre de consultation d'un lot.
   */
  closeDetail(): void {
    this.selectedDetail.set(null);
    this.selectedMaturities.set([]);
  }

  /**
   * Masque le dernier rapport sans modifier l'historique.
   */
  dismissImportResult(): void {
    this.lastImportResult.set(null);
  }

  /**
   * Contrôle localement le fichier sélectionné.
   */
  private setSelectedFile(
    file: File | null,
  ): void {
    this.fileError.set(null);
    this.pageError.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith('.csv')
    ) {
      this.selectedFile.set(null);

      this.fileError.set(
        'Seuls les fichiers CSV sont acceptés.',
      );

      return;
    }

    if (file.size === 0) {
      this.selectedFile.set(null);

      this.fileError.set(
        'Le fichier sélectionné est vide.',
      );

      return;
    }

    if (
      file.size >
      ImportsPageComponent.MAXIMUM_FILE_SIZE
    ) {
      this.selectedFile.set(null);

      this.fileError.set(
        'Le fichier ne doit pas dépasser 10 Mo.',
      );

      return;
    }

    this.selectedFile.set(file);
  }

  /**
   * Enregistre et affiche le rapport retourné par le backend.
   *
   * Cette méthode est utilisée pour :
   * - une importation réussie avec HTTP 201 ;
   * - un fichier rejeté avec HTTP 422.
   */
  private displayImportResult(
    result: CsvImportResponse,
  ): void {
    this.lastImportResult.set(result);
    this.selectedFile.set(null);
    this.fileError.set(null);
    this.pageError.set(null);

    /*
     * Le nouveau chargement doit apparaître immédiatement
     * en première page de l'historique.
     */
    this.loadHistory(0);
  }

  /**
   * Extrait le rapport métier retourné avec HTTP 422.
   *
   * error.error peut être :
   * - un objet JSON déjà désérialisé ;
   * - une chaîne JSON selon la configuration HTTP.
   */
  private extractRejectedImport(
    error: HttpErrorResponse,
  ): CsvImportResponse | null {
    if (error.status !== 422) {
      return null;
    }

    let responseBody: unknown = error.error;

    if (typeof responseBody === 'string') {
      try {
        responseBody = JSON.parse(responseBody);
      } catch {
        return null;
      }
    }

    if (
      responseBody === null ||
      typeof responseBody !== 'object'
    ) {
      return null;
    }

    const response =
      responseBody as Partial<CsvImportResponse>;

    if (
      typeof response.batchId !== 'number' ||
      response.status !== 'REJECTED' ||
      typeof response.fileName !== 'string' ||
      typeof response.totalRows !== 'number' ||
      typeof response.insertedRows !== 'number' ||
      typeof response.existingRows !== 'number' ||
      typeof response.errorRows !== 'number' ||
      !Array.isArray(response.errors)
    ) {
      return null;
    }

    return response as CsvImportResponse;
  }

  /**
   * Transforme une erreur HTTP technique en message lisible.
   */
  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    let responseBody: unknown = error.error;

    if (typeof responseBody === 'string') {
      try {
        responseBody = JSON.parse(responseBody);
      } catch {
        return error.status === 0
          ? 'Le serveur est actuellement inaccessible.'
          : 'Une erreur est survenue pendant le traitement.';
      }
    }

    const apiError =
      responseBody as ApiErrorResponse | null;

    if (apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'Le serveur est actuellement inaccessible.';
    }

    return 'Une erreur est survenue pendant le traitement.';
  }
}