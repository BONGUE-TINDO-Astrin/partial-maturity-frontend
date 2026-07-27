import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { filter } from 'rxjs';

/**
 * Élément affiché dans le chemin de navigation.
 *
 * Exemple :
 * Accueil > Chargements CSV
 */
interface NavigationPathItem {
  label: string;
  url: string;
}

/**
 * Affiche le chemin de navigation correspondant à la route active.
 *
 * <p>Les libellés sont récupérés depuis la propriété breadcrumb
 * définie dans app.routes.ts.</p>
 *
 * <p>Ce composant utilise l'état final du Router plutôt que les
 * instances ActivatedRoute du layout. Cette approche est plus simple
 * et plus fiable avec les composants chargés paresseusement.</p>
 */
@Component({
  selector: 'app-navigation-path',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navigation-path.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationPathComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Liste du chemin actuellement affiché.
   */
  readonly items = signal<NavigationPathItem[]>([]);

  constructor() {
    this.updateNavigationPath();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.updateNavigationPath();
      });
  }

  /**
   * Reconstruit le chemin à partir de l'arbre final
   * des routes actives.
   */
  private updateNavigationPath(): void {
    const items: NavigationPathItem[] = [];

    this.collectItems(
      this.router.routerState.snapshot.root,
      '',
      items,
    );

    this.items.set(items);
  }

  /**
   * Parcourt récursivement l'unique branche active du routeur.
   *
   * @param route route actuellement parcourue
   * @param parentUrl URL déjà reconstruite
   * @param items éléments collectés
   */
  private collectItems(
    route: ActivatedRouteSnapshot,
    parentUrl: string,
    items: NavigationPathItem[],
  ): void {
    const routePath = route.url
      .map((segment) => segment.path)
      .filter(Boolean)
      .join('/');

    const currentUrl = routePath
      ? `${parentUrl}/${routePath}`
      : parentUrl;

    const breadcrumb =
      route.data['breadcrumb'] as string | undefined;

    if (breadcrumb) {
      items.push({
        label: breadcrumb,
        url: currentUrl || '/app/dashboard',
      });
    }

    /*
     * Une seule branche de l'arbre correspond à la page active.
     * Nous poursuivons donc avec le premier enfant actif.
     */
    const childRoute = route.firstChild;

    if (childRoute) {
      this.collectItems(
        childRoute,
        currentUrl,
        items,
      );
    }
  }
}