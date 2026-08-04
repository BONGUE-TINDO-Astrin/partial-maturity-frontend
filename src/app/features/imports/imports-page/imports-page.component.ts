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
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleCheckBig,
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

import { resolveApiErrorMessage } from '../../../core/error-handling/api-error-utils';
import { ImportDetailDialogComponent } from '../import-detail-dialog/import-detail-dialog.component';
import { ImportsService } from '../imports.service';
import { CsvImportResponse } from '../models/csv-import-response';
import { ImportBatchDetail } from '../models/import-batch-detail';
import { ImportBatchSummary } from '../models/import-batch-summary';
import { PolicyMaturity } from '../models/policy-maturity';
/**
 * Écran principal des chargements CSV.
 *
 * Les contrôles locaux améliorent l'expérience utilisateur.
 * Le backend reste responsable des validations définitives.
 */
@Component({
  selector: 'app-imports-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ImportDetailDialogComponent,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCircleCheckBig,
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
  private static readonly MAXIMUM_FILE_SIZE =
    10 * 1024 * 1024;

  private readonly importsService =
    inject(ImportsService);

  readonly selectedFile =
    signal<File | null>(null);

  readonly dragActive = signal(false);

  /*
   * Les états restent séparés afin que le template indique
   * précisément l'opération actuellement exécutée.
   */
  readonly importing = signal(false);
  readonly loadingHistory = signal(false);
  readonly loadingDetail = signal(false);
  readonly loadingMaturities = signal(false);

  readonly pageError =
    signal<string | null>(null);

  readonly fileError =
    signal<string | null>(null);

  readonly lastImportResult =
    signal<CsvImportResponse | null>(null);

  readonly history =
    signal<ImportBatchSummary[]>([]);

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
   * Indique qu'une action principale susceptible de modifier
   * les données affichées est actuellement en cours.
   */
  readonly hasPendingOperation = computed(
    () =>
      this.importing() ||
      this.loadingHistory() ||
      this.loadingDetail(),
  );

  readonly canImport = computed(
    () =>
      this.selectedFile() !== null &&
      this.fileError() === null &&
      !this.hasPendingOperation(),
  );

  ngOnInit(): void {
    this.loadHistory(0);
  }

  selectFile(event: Event): void {
    if (this.hasPendingOperation()) {
      return;
    }

    const input =
      event.target as HTMLInputElement;

    this.setSelectedFile(
      input.files?.item(0) ?? null,
    );

    /*
     * La valeur est vidée afin que le même fichier puisse
     * être sélectionné une seconde fois après sa suppression.
     */
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (!this.hasPendingOperation()) {
      this.dragActive.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);

    if (this.hasPendingOperation()) {
      return;
    }

    this.setSelectedFile(
      event.dataTransfer?.files.item(0) ??
        null,
    );
  }

  removeSelectedFile(): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.selectedFile.set(null);
    this.fileError.set(null);
  }

  /**
   * Envoie le fichier sélectionné au backend.
   *
   * Un rejet HTTP 422 valide contient un rapport métier
   * qui doit être affiché comme résultat d'importation.
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
          /*
           * Le backend utilise HTTP 422 pour signaler un fichier
           * entièrement contrôlé mais rejeté fonctionnellement.
           */
          const rejectedImport =
            this.extractRejectedImport(error);

          if (rejectedImport) {
            this.displayImportResult(
              rejectedImport,
            );

            return;
          }

          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'Le fichier CSV ne peut pas être importé.',
            ),
          );
        },
      });
  }

  /**
   * Charge une page de l'historique des importations.
   */
  loadHistory(page: number): void {
    if (
      this.loadingHistory() ||
      this.loadingDetail()
    ) {
      return;
    }

    this.loadingHistory.set(true);
    this.pageError.set(null);

    this.importsService
      .getHistory(
        page,
        this.pageSize(),
      )
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
            resolveApiErrorMessage(
              error,
              'L’historique des importations ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  previousPage(): void {
    if (
      !this.firstPage() &&
      !this.hasPendingOperation()
    ) {
      this.loadHistory(
        this.currentPage() - 1,
      );
    }
  }

  nextPage(): void {
    if (
      !this.lastPage() &&
      !this.hasPendingOperation()
    ) {
      this.loadHistory(
        this.currentPage() + 1,
      );
    }
  }

  /**
   * Charge le détail d'un lot d'importation.
   *
   * Les maturités sont récupérées uniquement pour un lot importé.
   * Un lot rejeté possède seulement un rapport d'erreurs.
   */
  openDetail(
    batch: ImportBatchSummary,
  ): void {
    if (this.hasPendingOperation()) {
      return;
    }

    this.loadingDetail.set(true);
    this.pageError.set(null);
    this.selectedDetail.set(null);
    this.selectedMaturities.set([]);

    if (batch.status === 'IMPORTED') {
      this.loadImportedBatchDetail(batch.id);
      return;
    }

    this.loadRejectedBatchDetail(batch.id);
  }

  closeDetail(): void {
    if (this.loadingDetail()) {
      return;
    }

    this.selectedDetail.set(null);
    this.selectedMaturities.set([]);
  }

  dismissImportResult(): void {
    this.lastImportResult.set(null);
  }

  /**
   * Charge simultanément les informations générales du lot
   * et les maturités réellement insérées.
   */
  private loadImportedBatchDetail(
    batchId: number,
  ): void {
    this.loadingMaturities.set(true);

    forkJoin({
      detail:
        this.importsService.getDetail(batchId),

      maturities:
        this.importsService.getMaturities(
          batchId,
        ),
    })
      .pipe(
        finalize(() => {
          this.loadingDetail.set(false);
          this.loadingMaturities.set(false);
        }),
      )
      .subscribe({
        next: ({
          detail,
          maturities,
        }) => {
          this.selectedDetail.set(detail);
          this.selectedMaturities.set(
            maturities,
          );
        },

        error: (error: HttpErrorResponse) => {
          this.pageError.set(
            resolveApiErrorMessage(
              error,
              'Le détail du lot d’importation ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  /**
   * Un lot rejeté ne possède aucune maturité insérée.
   * Seul son rapport détaillé doit donc être chargé.
   */
  private loadRejectedBatchDetail(
    batchId: number,
  ): void {
    this.importsService
      .getDetail(batchId)
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
            resolveApiErrorMessage(
              error,
              'Le détail du lot d’importation ne peut pas être chargé.',
            ),
          );
        },
      });
  }

  /**
   * Applique les contrôles locaux avant de rendre
   * le fichier disponible pour l'importation.
   */
  private setSelectedFile(
    file: File | null,
  ): void {
    this.fileError.set(null);
    this.pageError.set(null);
    this.lastImportResult.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith('.csv')
    ) {
      this.rejectSelectedFile(
        'Seuls les fichiers CSV sont acceptés.',
      );

      return;
    }

    if (file.size === 0) {
      this.rejectSelectedFile(
        'Le fichier sélectionné est vide.',
      );

      return;
    }

    if (
      file.size >
      ImportsPageComponent.MAXIMUM_FILE_SIZE
    ) {
      this.rejectSelectedFile(
        'Le fichier ne doit pas dépasser 10 Mo.',
      );

      return;
    }

    this.selectedFile.set(file);
  }

  private rejectSelectedFile(
    message: string,
  ): void {
    this.selectedFile.set(null);
    this.fileError.set(message);
  }

  /**
   * Affiche le rapport retourné par le backend puis recharge
   * la première page afin de rendre le nouveau lot visible.
   */
  private displayImportResult(
    result: CsvImportResponse,
  ): void {
    this.lastImportResult.set(result);
    this.selectedFile.set(null);
    this.fileError.set(null);
    this.pageError.set(null);

    /*
     * L'importation ne peut commencer que lorsque l'historique
     * n'est pas déjà en chargement. Ce rechargement ne peut donc
     * pas entrer en conflit avec une requête précédente.
     */
    this.loadHistory(0);
  }

  /**
   * Extrait et valide le rapport métier retourné avec HTTP 422.
   *
   * Cette réponse n'est pas une erreur technique : elle confirme
   * que le fichier a été analysé puis rejeté dans son intégralité.
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
        responseBody =
          JSON.parse(responseBody);
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

    const response = responseBody as Partial<CsvImportResponse>;

    if (
      typeof response.batchId !== 'number' ||
      response.status !== 'REJECTED' ||
      typeof response.fileName !== 'string' ||
      typeof response.totalRows !== 'number' ||
      typeof response.insertedRows !==
        'number' ||
      typeof response.existingRows !==
        'number' ||
      typeof response.errorRows !==
        'number' ||
      !Array.isArray(response.errors)
    ) {
      return null;
    }

    return response as CsvImportResponse;
  }
}