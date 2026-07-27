import { Routes } from '@angular/router';

import { authenticationGuard } from './core/route-protection/authentication.guard';
import { publicOnlyGuard } from './core/route-protection/public-only.guard';
import { roleGuard } from './core/route-protection/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import(
        './features/authentication/login/login.component'
      ).then(
        (module) => module.LoginComponent,
      ),
  },

  {
    path: 'app',
    canActivate: [authenticationGuard],
    loadComponent: () =>
      import(
        './layout/application-shell/application-shell.component'
      ).then(
        (module) => module.ApplicationShellComponent,
      ),

    children: [
      {
        path: 'dashboard',
        data: {
          breadcrumb: 'Tableau de bord',
        },
        loadComponent: () =>
          import(
            './features/dashboard/dashboard.component'
          ).then(
            (module) => module.DashboardComponent,
          ),
      },

      {
        path: 'imports',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          breadcrumb: 'Chargements CSV',
          title: 'Chargements CSV',
          description:
            'Importation et contrôle des fichiers de maturités.',
        },
        loadComponent: () =>
          import(
            './shared/ui-components/feature-placeholder/feature-placeholder.component'
          ).then(
            (module) =>
              module.FeaturePlaceholderComponent,
          ),
      },

      {
        path: 'users',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          breadcrumb: 'Utilisateurs',
          title: 'Gestion des utilisateurs',
          description:
            'Création, activation et désactivation des comptes.',
        },
        loadComponent: () =>
          import(
            './shared/ui-components/feature-placeholder/feature-placeholder.component'
          ).then(
            (module) =>
              module.FeaturePlaceholderComponent,
          ),
      },

      {
        path: 'audit',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          breadcrumb: 'Audit',
          title: 'Journal d’audit',
          description:
            'Consultation des actions métier sensibles.',
        },
        loadComponent: () =>
          import(
            './shared/ui-components/feature-placeholder/feature-placeholder.component'
          ).then(
            (module) =>
              module.FeaturePlaceholderComponent,
          ),
      },

      {
        path: 'policies',
        canActivate: [roleGuard],
        data: {
          roles: ['COMPTABILITE'],
          breadcrumb: 'Polices',
          title: 'Recherche des polices',
          description:
            'Consultation des maturités et calcul des intérêts.',
        },
        loadComponent: () =>
          import(
            './shared/ui-components/feature-placeholder/feature-placeholder.component'
          ).then(
            (module) =>
              module.FeaturePlaceholderComponent,
          ),
      },

      {
        path: 'payments',
        canActivate: [roleGuard],
        data: {
          roles: ['COMPTABILITE'],
          breadcrumb: 'Paiements',
          title: 'Gestion des paiements',
          description:
            'Enregistrement et annulation des paiements.',
        },
        loadComponent: () =>
          import(
            './shared/ui-components/feature-placeholder/feature-placeholder.component'
          ).then(
            (module) =>
              module.FeaturePlaceholderComponent,
          ),
      },

      {
        path: 'access-denied',
        loadComponent: () =>
          import(
            './features/errors/access-denied.component'
          ).then(
            (module) => module.AccessDeniedComponent,
          ),
      },

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];