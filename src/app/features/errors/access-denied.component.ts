import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main
      class="flex min-h-[70vh] items-center justify-center p-6"
    >
      <div class="max-w-lg text-center">
        <p
          class="text-sm font-semibold uppercase tracking-wider text-[#F4511E]"
        >
          Accès refusé
        </p>

        <h1 class="mt-3 text-4xl font-bold text-slate-900">
          Autorisation insuffisante
        </h1>

        <p class="mt-4 text-slate-600">
          Votre compte ne dispose pas des droits nécessaires
          pour consulter cette page.
        </p>

        <a
          routerLink="/app/dashboard"
          class="mt-8 inline-flex rounded-lg bg-[#78060D] px-5 py-3 font-semibold text-white hover:bg-[#65050B]"
        >
          Retour au tableau de bord
        </a>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedComponent {}