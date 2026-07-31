# BeLife Partial Maturity Frontend

Interface Angular du module de gestion des maturités partielles de BeLife Insurance.

## Dépôts associés

- Documentation fonctionnelle : `belife-partial-maturity-docs`
- API Spring Boot : `belife-partial-maturity-backend`

## Fonctionnalités

- authentification et gestion de session ;
- tableau de bord adapté au rôle ;
- administration des utilisateurs ;
- import CSV et historique des chargements ;
- consultation des polices et maturités ;
- simulation des intérêts ;
- paiement total et annulation ;
- historique des paiements ;
- journal d’audit.

## Stack

```text
Angular
TypeScript
Standalone Components
Signals
Reactive Forms
RxJS
Tailwind CSS
Lucide Angular
```

## Prérequis

- Node.js ;
- npm ;
- Angular CLI ;
- backend BeLife démarré.

Vérification :

```bash
node --version
npm --version
ng version
```

## Installation

```bash
npm install
```

## Configuration de l’API

L’application doit pointer vers l’API Spring Boot, par exemple :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
};
```

Un exemple est fourni dans :

```text
src/environments/environment.example.ts
```

Si le projet utilise déjà `applicationConfig.apiUrl`, conserver ce mécanisme et adapter uniquement la valeur selon l’environnement.

## Démarrage

```bash
ng serve
```

L’application est disponible par défaut à l’adresse :

```text
http://localhost:4200
```

## Compilation

```bash
ng build
```

Les artefacts de production sont générés dans `dist/`.

## Rôles

### ADMIN

- gestion des utilisateurs ;
- imports CSV ;
- consultation des polices et simulations ;
- consultation des paiements ;
- journal d’audit ;
- tableau de bord administratif.

### COMPTABILITE

- consultation des polices ;
- simulation des intérêts ;
- paiement total ;
- annulation de paiement ;
- historique des paiements ;
- tableau de bord comptable.

Les guards et masquages Angular améliorent l’expérience utilisateur. Le backend reste responsable de la sécurité définitive.

## Principes financiers

Angular ne doit jamais :

- recalculer les intérêts ;
- envoyer un taux faisant autorité ;
- envoyer le montant définitif du paiement.

Le backend retourne les montants calculés avec six décimales. Angular les affiche avec :

```text
1.6-6
```

## Structure fonctionnelle

```text
src/app/
├── core/
├── shared/
└── features/
    ├── authentication/
    ├── users/
    ├── imports/
    ├── policies/
    ├── payments/
    ├── audit/
    └── dashboard/
```

Chaque fonctionnalité contient uniquement les modèles, services HTTP, pages et composants nécessaires.

## Qualité

Conventions principales :

- composants standalone ;
- `ChangeDetectionStrategy.OnPush` ;
- Signals pour l’état local ;
- Reactive Forms pour les formulaires ;
- services dédiés aux appels HTTP ;
- dialogues Angular plutôt que `window.alert`, `window.confirm` ou `window.prompt` ;
- aucune logique financière dupliquée dans le frontend.

## Vérifications avant commit

```bash
ng build
git status
```

Vérifier également :

- aucune URL de production codée en dur ;
- aucun JWT ou token dans Git ;
- aucune donnée métier confidentielle ;
- aucune icône Lucide dépréciée ;
- aucune erreur TypeScript ou de template.

## Documentation complémentaire

Voir :

```text
docs/frontend-architecture-and-api.md
```
