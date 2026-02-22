# Architecture Technique EduTrack

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Firebase Cloud Functions v1 (Node 20, europe-west1) |
| Base de données | Cloud Firestore |
| Authentification | Firebase Auth |
| Stockage fichiers | Firebase Storage |
| Hébergement | Firebase Hosting (CDN global) |
| Paiements | Stripe (backend prêt, UI à activer) |

---

## Multi-tenancy

Chaque établissement = un `schoolId`. Tous les documents Firestore portent ce champ. Chaque Cloud Function commence par `getSchoolId(uid)` pour filtrer automatiquement les données.

```
users/{uid}          → schoolId: "abc123"
eleves/{id}          → schoolId: "abc123"
paiements/{id}       → schoolId: "abc123"
schools/{schoolId}   → config de l'établissement
```

Règle Firestore : un utilisateur ne peut lire/écrire que les documents dont `schoolId == son propre schoolId`.

---

## Cloud Functions (~70 fonctions)

Organisées par module dans `functions/src/modules/` :

```
modules/
├── users/         présences, stats
├── paiements/     CRUD, versements, stats
├── presences/     appel individuel et batch
├── notes/         évaluations, notes, moyennes, bulletins
├── cahier/        cahier de texte
├── stats/         dashboard, advanced, comparison, at-risk
├── compta/        dépenses, salaires
├── discipline/    CRUD incidents
├── notifications/ push, email, config
├── exports/       CSV/Excel élèves, notes, présences, paiements
├── emploi/        créneaux, conflits
├── matieres/      CRUD
├── classes/       promotion, archivage
├── audit/         journal
├── reports/       rapports mensuels planifiés
├── recommendations/ analyse IA des données
├── billing/       Stripe checkout, webhook, portal
├── schools/       CRUD établissements (super admin)
└── migration/     migration données vers multi-tenant
```

---

## Structure Frontend

```
src/
├── context/       AuthContext, ThemeContext, LanguageContext,
│                  SchoolContext, TenantContext
├── Layout/        AdminLayout (nav, header, messages non lus)
├── pages/         Dashboard, PaiementsList, Messages, ...
├── modules/       paiements/, eleves/, notes/, presences/, ...
├── components/    charts (LineChart, BarChart, CircularProgress),
│                  DashboardWidgetConfig, GlobalSearch, ...
├── hooks/         useDashboardWidgets, useKeyboardShortcuts, ...
├── services/      cloudFunctions.ts (tous les appels CF)
└── utils/         offlineCache, csvExport, pdfExports, ...
```

---

## Sécurité

- Toutes les opérations sensibles passent par des Cloud Functions (pas d'écriture directe Firestore côté client pour les actions critiques)
- `requireAuth()` + `requirePermission()` sur chaque fonction
- Règles Firestore : isolation par `schoolId`, lecture limitée par rôle
- Indexes composites pour les requêtes `where(schoolId) + orderBy(field)`
- `fieldOverride` COLLECTION_GROUP pour `appels.schoolId` (requêtes sur sous-collections)

---

## Déploiement

```bash
# Build frontend
npx vite build

# Build fonctions
cd functions && npm run build

# Déployer tout
npx firebase deploy
```

---

*EduTrack — Février 2026*
