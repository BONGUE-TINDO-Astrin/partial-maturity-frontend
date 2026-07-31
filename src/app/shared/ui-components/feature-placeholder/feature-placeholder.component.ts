import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideConstruction } from '@lucide/angular';

/**
 * Page temporaire utilisée tant qu'une fonctionnalité
 * n'a pas encore été développée.
 *
 * Ce composant sera supprimé progressivement au profit
 * des fonctionnalités définitives.
 */
@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [LucideConstruction],
  templateUrl: './feature-placeholder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.readRouteText(
    'title',
    'Fonctionnalité',
  );

  readonly description = this.readRouteText(
    'description',
    'Cette fonctionnalité sera disponible prochainement.',
  );

  private readRouteText(
    key: string,
    fallback: string,
  ): string {
    const value = this.route.snapshot.data[key];

    return typeof value === 'string' && value.trim()
      ? value
      : fallback;
  }
}
