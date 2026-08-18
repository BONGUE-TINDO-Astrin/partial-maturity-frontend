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
            './features/dashboard/dashboard-page/dashboard-page.component'
          ).then(
            (module) => module.DashboardPageComponent,
          ),
      },

      {
        path: 'imports',
        data: {
          breadcrumb: 'Chargements CSV',
        },
        loadComponent: () =>
          import(
            './features/imports/imports-page/imports-page.component'
          ).then(
            (module) => module.ImportsPageComponent,
          ),
      },

      {
        path: 'users',
        canActivate: [roleGuard],
        data: {
            roles: ['ADMIN'],
            breadcrumb: 'Utilisateurs',
        },
        loadComponent: () =>
            import(
            './features/users/users-page/users-page.component'
            ).then(
            (module) => module.UsersPageComponent,
            ),
        },

      {
        path: 'audit',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN'],
          breadcrumb: 'Journal d’audit',
        },
        loadComponent: () =>
          import(
            './features/audit/audit-page/audit-page.component'
          ).then(
            (module) => module.AuditPageComponent,
          ),
      },

      {
        path: 'policies',
        canActivate: [roleGuard],
        data: {
          roles: ['ADMIN', 'COMPTABILITE'],
          breadcrumb: 'Polices',
        },
        loadComponent: () =>
          import(
            './features/policies/policies-page/policies-page.component'
          ).then(
            (module) => module.PoliciesPageComponent,
          ),
      },

      {
        path: 'payments',
        canActivate: [roleGuard],
        data: {
          roles: [
            'ADMIN',
            'COMPTABILITE',
          ],
          breadcrumb: 'Paiements',
        },
        loadComponent: () =>
          import(
            './features/payments/payments-page/payments-page.component'
          ).then(
            (module) => module.PaymentsPageComponent,
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