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
import { LucideChevronRight } from '@lucide/angular';
import { filter } from 'rxjs';

interface NavigationPathItem {
  readonly label: string;
  readonly url: string;
}

/**
 * Affiche le chemin de navigation correspondant à la route active.
 * Les libellés proviennent de la propriété breadcrumb des routes.
 */
@Component({
  selector: 'app-navigation-path',
  standalone: true,
  imports: [
    RouterLink,
    LucideChevronRight,
  ],
  templateUrl: './navigation-path.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationPathComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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
      .subscribe(() => this.updateNavigationPath());
  }

  private updateNavigationPath(): void {
    const items: NavigationPathItem[] = [];

    this.collectItems(
      this.router.routerState.snapshot.root,
      '',
      items,
    );

    this.items.set(items);
  }

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

    const breadcrumb = route.data['breadcrumb'];

    if (typeof breadcrumb === 'string' && breadcrumb.trim()) {
      items.push({
        label: breadcrumb,
        url: currentUrl || '/app/dashboard',
      });
    }

    if (route.firstChild) {
      this.collectItems(
        route.firstChild,
        currentUrl,
        items,
      );
    }
  }
}
