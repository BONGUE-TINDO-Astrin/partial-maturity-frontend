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
 * Cette page sera supprimée progressivement au fur et à mesure
 * de la livraison des vraies fonctionnalités.
 */
@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [LucideConstruction],
  template: `
    <section class="p-4 sm:p-6 lg:p-8">
      <div
        class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-[#F4511E]"
        >
          <svg
            lucideConstruction
            class="size-6"
            aria-hidden="true"
          ></svg>
        </div>

        <h1 class="mt-6 text-3xl font-bold text-slate-900">
          {{ title }}
        </h1>

        <p class="mt-3 max-w-2xl text-slate-600">
          {{ description }}
        </p>

        <p
          class="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
        >
          Fonctionnalité planifiée
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title =
    this.route.snapshot.data['title'] ??
    'Fonctionnalité';

  readonly description =
    this.route.snapshot.data['description'] ??
    'Cette fonctionnalité sera disponible prochainement.';
}