# Architecture frontend et intégration API

## 1. Architecture

Le frontend est organisé par fonctionnalités :

```text
authentication
users
imports
policies
payments
audit
dashboard
```

Organisation recommandée d’une fonctionnalité :

```text
models/
feature-page/
feature-dialog/
feature.service.ts
```

Les composants utilisent les composants standalone, les Signals, les Reactive Forms et la stratégie `OnPush`.

## 2. Core et Shared

### Core

Contient les éléments globaux et uniques :

- authentification ;
- configuration ;
- guards ;
- interceptors HTTP ;
- gestion des erreurs ;
- layout principal.

### Shared

Contient uniquement les éléments réellement réutilisés par plusieurs fonctionnalités :

- modèles génériques ;
- composants communs ;
- utilitaires d’affichage.

Éviter de déplacer prématurément un modèle métier dans `shared` s’il n’est utilisé que par une fonctionnalité.

## 3. Authentification

L’interceptor ajoute le JWT :

```http
Authorization: Bearer <token>
```

Comportement attendu :

- `401` : nettoyer la session et rediriger vers la connexion ;
- `403` : afficher ou rediriger vers l’accès refusé ;
- `422` : transmettre le rejet métier au composant ;
- autres erreurs : conserver la réponse pour son traitement local.

L’interceptor ne doit pas absorber les erreurs métier.

## 4. Routes et rôles

Routes principales :

```text
/app/dashboard
/app/users
/app/imports
/app/policies
/app/payments
/app/audit
```

Droits :

```text
Dashboard : ADMIN, COMPTABILITE
Users     : ADMIN
Imports   : ADMIN
Policies  : ADMIN, COMPTABILITE
Payments  : ADMIN en lecture, COMPTABILITE en action
Audit     : ADMIN
```

Les guards protègent la navigation. Les contrôles définitifs restent dans Spring Security.

## 5. Intégration API

Base locale typique :

```text
http://localhost:8080/api/v1
```

Formats utilisés :

- JSON pour les opérations classiques ;
- `multipart/form-data` pour les fichiers CSV.

Pour un import CSV, ne pas définir manuellement le header `Content-Type`. Le navigateur doit générer la boundary multipart.

## 6. États d’interface

Chaque page asynchrone doit gérer :

```text
chargement
succès
erreur métier
erreur technique
état vide
```

Les paiements et annulations doivent utiliser des dialogues Angular accessibles. Les boîtes natives `window.confirm()` et `window.prompt()` ne doivent pas être utilisées.

## 7. Montants et dates

Angular affiche les montants avec six décimales :

```html
{{ amount | number: '1.6-6' }}
```

Angular ne recalcule ni les intérêts ni le montant du paiement.

Pour les dates métier sans heure, utiliser un format stable avec le fuseau `UTC` si nécessaire afin d’éviter un décalage de jour :

```html
{{ date | date: 'dd/MM/yyyy': 'UTC' }}
```

## 8. Imports CSV

Le frontend vérifie uniquement l’ergonomie :

- extension `.csv` ;
- fichier non vide ;
- taille maximale de 10 Mo.

Le backend reste responsable de toutes les validations définitives.

Une réponse `422` contenant un rapport `REJECTED` doit être affichée comme un résultat métier et non comme une panne technique.

## 9. Paiements

Parcours :

```text
simulation
→ confirmation Angular
→ requête sans montant
→ recalcul backend
→ message de succès
→ nouvelle simulation
```

Après un paiement valide, la simulation doit être actualisée et afficher un solde nul.

Après une annulation, l’historique doit être actualisé et la situation financière redevient calculable.

## 10. Audit et tableau de bord

Le journal d’audit est réservé à `ADMIN`.

Le tableau de bord consomme une seule route backend. Le backend retourne uniquement les sections autorisées :

```text
ADMIN         : administration, imports, audit
COMPTABILITE  : portefeuille, paiements
```

Le frontend affiche uniquement les sections reçues.

## 11. Vérifications avant livraison

```bash
npm install
ng build
```

Contrôler manuellement :

- connexion avec les deux rôles ;
- guards et menus ;
- import valide et rejeté ;
- consultation et simulation ;
- paiement et confirmation ;
- annulation avec motif ;
- journal d’audit ;
- tableaux de bord ;
- affichage mobile et desktop ;
- absence d’erreurs dans la console du navigateur.
