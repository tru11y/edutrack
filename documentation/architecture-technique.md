# Architecture Technique EduTrack

> Ce document décrit l'architecture technique de la plateforme EduTrack : stack technologique, structure du code, modèle de données, sécurité, déploiement et bonnes pratiques de développement. Il s'adresse aux équipes techniques, DSI et développeurs travaillant sur la plateforme.

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Stack technologique](#2-stack-technologique)
3. [Architecture Frontend (React + Vite)](#3-architecture-frontend-react--vite)
4. [Architecture Backend (Firebase)](#4-architecture-backend-firebase)
5. [Modèle de données Firestore](#5-modèle-de-données-firestore)
6. [Architecture multi-tenant](#6-architecture-multi-tenant)
7. [Sécurité et règles Firestore](#7-sécurité-et-règles-firestore)
8. [Cloud Functions](#8-cloud-functions)
9. [Authentification](#9-authentification)
10. [Stockage de fichiers](#10-stockage-de-fichiers)
11. [Intégration Stripe (facturation)](#11-intégration-stripe-facturation)
12. [Notifications (Push et Email)](#12-notifications-push-et-email)
13. [Déploiement et CI/CD](#13-déploiement-et-cicd)
14. [Performance et scalabilité](#14-performance-et-scalabilité)
15. [Patterns de développement](#15-patterns-de-développement)
16. [Monitoring et observabilité](#16-monitoring-et-observabilité)

---

## 1. Vue d'ensemble de l'architecture

EduTrack suit une architecture **SPA (Single Page Application)** côté client, avec Firebase comme Backend as a Service (BaaS). Les opérations sensibles sont déléguées à des **Cloud Functions** pour garantir la sécurité et la logique métier côté serveur.

### Schéma d'architecture global

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING (CDN)                            │
│              Build React/Vite statique servi globalement             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CLIENT (Navigateur Web)                             │
│                                                                      │
│   React 18 + Vite + TypeScript                                       │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│   │  React      │  │ Firebase SDK │  │  Stripe.js (billing UI)   │ │
│   │  Router v6  │  │ (client-side)│  │                           │ │
│   └─────────────┘  └──────────────┘  └───────────────────────────┘ │
└──────┬───────────────────┬──────────────────────────────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐   ┌────────────────────────────────────────────────────┐
│   STRIPE    │   │              FIREBASE (europe-west1)                │
│   API       │   │                                                     │
│  Checkout   │   │  ┌───────────┐  ┌──────────┐  ┌────────────────┐ │
│  Webhooks   │   │  │  Auth     │  │Firestore │  │   Functions    │ │
└─────────────┘   │  │ (JWT +    │  │ (NoSQL   │  │  (Node.js v1) │ │
                  │  │  roles)   │  │  multi-  │  │  europe-west1 │ │
                  │  └───────────┘  │  tenant) │  └────────────────┘ │
                  │                 └──────────┘                      │
                  │  ┌───────────┐  ┌──────────┐                     │
                  │  │  Storage  │  │   FCM    │                     │
                  │  │  (files,  │  │  (Push   │                     │
                  │  │  photos,  │  │  notifs) │                     │
                  │  │  PDFs)    │  └──────────┘                     │
                  │  └───────────┘                                    │
                  └────────────────────────────────────────────────────┘
```

### Principes architecturaux

| Principe | Application dans EduTrack |
|----------|--------------------------|
| Sécurité par défaut | Toutes les données protégées par des règles Firestore + vérification côté serveur |
| Isolation des données | Chaque établissement isolé par `schoolId` — multi-tenant strict |
| Serverless | Pas de serveur à gérer — Firebase gère l'infrastructure |
| Offline-first | Firestore SDK client avec cache local — fonctionne temporairement sans réseau |
| TypeScript strict | Typage fort sur tout le codebase frontend et fonctions |

---

## 2. Stack technologique

### Frontend

| Technologie | Version | Rôle |
|------------|---------|------|
| React | 18.x | Framework UI — composants, état, cycle de vie |
| Vite | 5.x | Bundler et serveur de développement (remplacement de CRA) |
| TypeScript | 5.x | Typage statique — réduction des bugs runtime |
| React Router | v6 | Routing côté client — SPA navigation |
| Tailwind CSS | 3.x | Utilitaire CSS (partiellement utilisé) |
| Recharts | 2.x | Graphiques (LineChart présences, BarChart paiements) |
| jsPDF | 2.x | Génération de PDF côté client (bulletins, reçus) |

### Backend (Firebase)

| Service Firebase | Rôle |
|----------------|------|
| Firebase Authentication | Gestion des identités — JWT, sessions, réinitialisation de mot de passe |
| Cloud Firestore | Base de données NoSQL — stockage de toutes les données métier |
| Cloud Functions | Backend serverless — logique métier sécurisée, Cloud Functions v1 |
| Firebase Hosting | Hébergement du frontend React compilé |
| Firebase Storage | Stockage des fichiers binaires (photos, PDF, documents) |
| Firebase Cloud Messaging (FCM) | Notifications push navigateur |

### Région de déploiement

**Toutes les ressources Firebase sont déployées dans la région `europe-west1` (Belgique, UE).**

Ce choix garantit :
- Conformité RGPD (données dans l'UE)
- Latence optimale pour les utilisateurs européens
- Cohérence des timestamps (zone Europe)

### Services tiers

| Service | Rôle |
|---------|------|
| Stripe | Facturation SaaS — abonnements, paiements, webhooks |
| SendGrid (ou Firebase Email) | Emails transactionnels (invitations, notifications) |

---

## 3. Architecture Frontend (React + Vite)

### Structure des répertoires

```
src/
├── assets/                  # Images, icônes statiques
├── components/              # Composants UI génériques et réutilisables
│   ├── ui/                  # Primitives : Button, Input, Modal, Table...
│   ├── layout/              # Sidebar, Navbar, Layout wrapper
│   └── shared/              # Composants partagés entre modules
├── contexts/                # Contextes React globaux
│   ├── AuthContext.tsx       # Utilisateur connecté, rôle, schoolId
│   ├── ThemeContext.tsx      # Thème clair/sombre, couleurs établissement
│   └── LanguageContext.tsx   # Internationalisation, fonction t()
├── hooks/                   # Hooks React personnalisés
│   ├── useAuth.ts            # Accès au contexte auth
│   ├── useTheme.ts           # Accès aux couleurs du thème
│   └── useFirestore.ts       # Helpers Firestore réutilisables
├── modules/                 # Modules fonctionnels (domaine métier)
│   ├── eleves/
│   │   ├── ElevesPage.tsx    # Composant principal du module
│   │   ├── EleveCard.tsx     # Composant carte élève
│   │   ├── eleves.service.ts # Logique métier + appels Firestore
│   │   └── eleve.types.ts    # Types TypeScript du domaine
│   ├── classes/
│   ├── profs/
│   ├── matieres/
│   ├── emploiDuTemps/
│   ├── presences/
│   ├── evaluations/
│   ├── bulletins/
│   ├── paiements/
│   ├── comptabilite/
│   ├── messages/
│   ├── notifications/
│   ├── cahierDeTexte/
│   ├── discipline/
│   ├── admissions/
│   ├── transport/
│   ├── bibliotheque/
│   ├── rh/
│   ├── lms/
│   ├── analytics/
│   ├── audit/
│   ├── archives/
│   ├── admin/               # Module admin spécial (utilisateurs, paramètres)
│   │   └── users/
│   │       └── eleves/      # Type élève simplifié pour la gestion admin
│   └── dashboard/
├── services/
│   ├── cloudFunctions.ts    # Point d'entrée unique pour tous les appels Cloud Functions
│   ├── firebase.ts           # Initialisation Firebase SDK
│   └── stripe.ts             # Helpers Stripe
├── utils/                   # Fonctions utilitaires pures
├── routes/                  # Configuration du routing React Router
│   ├── AdminRoutes.tsx       # Routes protégées admin/gestionnaire
│   ├── ProfRoutes.tsx        # Routes portail professeur
│   ├── EleveRoutes.tsx       # Routes portail élève
│   └── ParentRoutes.tsx      # Routes portail parent
└── main.tsx                 # Point d'entrée de l'application
```

### Pattern de module

Chaque module suit une structure standardisée :

```
modules/{domaine}/
├── {Domaine}Page.tsx         # Composant page principal (liste + actions)
├── {Domaine}Form.tsx         # Formulaire de création/modification
├── {Domaine}Detail.tsx       # Vue détaillée d'un élément
├── {domaine}.service.ts      # Service : CRUD Firestore + logique métier
└── {domaine}.types.ts        # Types TypeScript du domaine
```

**Exemple : module élèves**

```typescript
// eleve.types.ts
export interface Eleve {
  id?: string;               // ID du document Firestore (optionnel = non encore créé)
  schoolId: string;          // Identifiant de l'établissement (multi-tenant)
  prenom: string;
  nom: string;
  dateNaissance: string;     // ISO 8601
  classeId: string;          // Référence vers un document classe
  email?: string;
  emailParent?: string;
  telephone?: string;
  adresse?: string;
  photoURL?: string;
  statut: 'actif' | 'inactif';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Contextes React

**ThemeContext :**
```typescript
// Usage dans n'importe quel composant
import { useTheme } from '../contexts/ThemeContext';

const MonComposant = () => {
  const { colors } = useTheme();
  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      ...
    </div>
  );
};
```

Le contexte `ThemeContext` expose un objet `colors` qui contient toutes les couleurs adaptées au thème actuel (clair/sombre) et aux couleurs personnalisées de l'établissement.

**LanguageContext :**
```typescript
// Usage pour l'internationalisation
import { useLanguage } from '../contexts/LanguageContext';

const MonComposant = () => {
  const { t } = useLanguage();
  return <h1>{t('dashboard.title')}</h1>;
};
```

**AuthContext :**
```typescript
// Usage pour accéder à l'utilisateur connecté
import { useAuth } from '../hooks/useAuth';

const MonComposant = () => {
  const { user, userRole, schoolId } = useAuth();
  // user : objet Firebase User
  // userRole : 'admin' | 'gestionnaire' | 'prof' | 'eleve' | 'parent'
  // schoolId : identifiant de l'établissement de l'utilisateur
};
```

### Routing et protection des routes

Le routing est configuré avec React Router v6. Les routes sont protégées par des composants de garde qui vérifient le rôle de l'utilisateur connecté :

```typescript
// routes/AdminRoutes.tsx — Extrait simplifié
const AdminRoutes = () => {
  const { userRole } = useAuth();

  if (!['admin', 'gestionnaire'].includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};
```

### Styles et thèmes

EduTrack utilise principalement des **styles en ligne** (`style={{ }}`) avec les valeurs issues du `ThemeContext`. Certains composants utilisent Tailwind CSS. Les deux approches coexistent mais ne doivent pas être mélangées dans un même composant.

**Règle de style :**
- Nouveaux composants : utiliser les styles en ligne avec `useTheme().colors`
- Ne pas introduire de classes Tailwind dans des composants qui utilisent déjà les styles en ligne
- Les composants UI génériques (`src/components/ui/`) peuvent utiliser Tailwind

---

## 4. Architecture Backend (Firebase)

### Firebase comme BaaS

Firebase joue le rôle de backend complet pour EduTrack :

| Service | Responsabilité |
|---------|---------------|
| Authentication | Gestion des sessions, JWT, rôles via Custom Claims |
| Firestore | Persistance de toutes les données métier |
| Cloud Functions | Logique métier sécurisée non exposable côté client |
| Storage | Fichiers binaires (photos, PDF, documents) |
| FCM | Notifications push Web |
| Hosting | Hébergement du bundle React compilé |

### Cloud Firestore — Choix NoSQL

Firestore est une base de données documentaire NoSQL. Chaque entité métier est stockée dans une collection, et chaque document peut contenir des sous-collections.

**Avantages de Firestore pour EduTrack :**
- Scalabilité automatique sans configuration
- Synchronisation en temps réel (les données s'actualisent automatiquement dans le navigateur)
- SDK client disponible — pas d'API REST à écrire pour les lectures simples
- Offline support natif — le SDK Firestore met les données en cache localement

---

## 5. Modèle de données Firestore

### Structure des collections

Toutes les collections de données métier suivent le pattern plat avec champ `schoolId` pour le multi-tenant :

```
firestore/
├── schools/                   # Données des établissements
│   └── {schoolId}/
│       ├── name: string
│       ├── logo: string (URL)
│       ├── primaryColor: string
│       ├── subscriptionPlan: 'starter'|'basic'|'pro'|'enterprise'
│       └── settings: object
│
├── users/                     # Comptes utilisateurs
│   └── {userId}/
│       ├── schoolId: string
│       ├── email: string
│       ├── role: 'admin'|'gestionnaire'|'prof'|'eleve'|'parent'
│       ├── prenom: string
│       ├── nom: string
│       └── permissions: object  # Permissions granulaires
│
├── eleves/                    # Élèves (collection plate)
│   └── {eleveId}/
│       ├── schoolId: string   # REQUIS — isolation multi-tenant
│       ├── prenom, nom, dateNaissance...
│       ├── classeId: string
│       └── statut: 'actif'|'inactif'
│
├── classes/
│   └── {classeId}/
│       ├── schoolId: string
│       ├── nom: string
│       └── niveau: string
│
├── matieres/
│   └── {matiereId}/
│       ├── schoolId: string
│       ├── nom: string
│       ├── abreviation: string
│       └── coefficient: number
│
├── cours/                     # Emploi du temps
│   └── {coursId}/
│       ├── schoolId: string
│       ├── matiereId: string  # "matiere" non "nom" — voir notes ci-dessous
│       ├── classeId: string
│       ├── profId: string
│       ├── salleId: string
│       ├── jour: number       # 0=Lundi, 4=Vendredi
│       ├── heureDebut: string # "08:00"
│       └── heureFin: string   # "09:00"
│
├── presences/
│   └── {presenceId}/
│       ├── schoolId: string
│       ├── coursId: string
│       ├── eleveId: string
│       ├── date: Timestamp
│       ├── statut: 'present'|'absent'|'retard'
│       └── justifie: boolean
│
├── evaluations/
│   └── {evalId}/
│       ├── schoolId: string
│       ├── titre: string
│       ├── matiereId: string
│       ├── classeId: string
│       ├── profId: string
│       ├── date: Timestamp
│       ├── sur: number        # Barème (20 par défaut)
│       ├── coefficient: number
│       └── trimestre: 1|2|3
│
├── notes/
│   └── {noteId}/
│       ├── schoolId: string
│       ├── evaluationId: string
│       ├── eleveId: string
│       ├── note: number
│       ├── appreciation: string
│       └── statut: 'present'|'absent'|'non-rendu'
│
├── paiements/
│   └── {paiementId}/
│       ├── schoolId: string
│       ├── eleveId: string
│       ├── mois: string       # "2025-10" (YYYY-MM)
│       ├── montantAttendu: number
│       ├── montantRecu: number
│       ├── mode: string
│       └── date: Timestamp
│
├── messages/
│   └── {messageId}/
│       ├── schoolId: string
│       ├── fromId: string
│       ├── toIds: string[]
│       ├── objet: string
│       ├── corps: string
│       └── lu: {[userId]: boolean}
│
├── presenceCours/             # Appels par séance
│   └── {id?}/                 # id optionnel (du doc Firestore)
│       ├── schoolId: string
│       ├── coursId: string
│       ├── date: Timestamp
│       └── presences: PresenceMap
│
├── bulletins/
├── admissions/
├── transport/
├── bibliotheque/
├── rh_conges/
├── lms_devoirs/
├── lms_soumissions/
├── audit_logs/
└── depenses/
```

### Notes importantes sur le modèle

**Type `Cours` :**
Le type `Cours` utilise le champ `matiereId` (référence) et `matiere` (nom dénormalisé), jamais un champ `nom` ou `description`. Cela a été une source d'erreurs par le passé.

```typescript
// CORRECT
interface Cours {
  matiereId: string;   // ID de la matière
  matiere: string;     // Nom dénormalisé pour l'affichage
  // PAS de champ "nom" ou "description" sur Cours
}
```

**Type `PresenceCoursPayload` :**
Le champ `id` est optionnel car il correspond à l'ID du document Firestore (inexistant lors de la création) :

```typescript
interface PresenceCoursPayload {
  id?: string;         // Optionnel — ID du doc Firestore
  schoolId: string;
  coursId: string;
  date: Timestamp;
  presences: PresenceMap;
}
```

**Deux types `Eleve` :**
Deux types distincts existent dans la codebase pour des raisons historiques :
- `src/modules/eleves/eleve.types.ts` — Type principal complet (toutes les données)
- `src/modules/admin/users/eleves/eleve.types.ts` — Type simplifié pour la gestion admin

Toujours utiliser le type principal sauf dans le contexte spécifique de la gestion admin.

### Index Firestore

Les requêtes composites nécessitent des index définis dans `firestore.indexes.json`. Les index les plus importants :

```json
{
  "indexes": [
    {
      "collectionGroup": "eleves",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "statut", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "presences",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "classeId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "paiements",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "mois", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 6. Architecture multi-tenant

### Principe d'isolation

Chaque établissement (tenant) est identifié par un `schoolId` unique (UUID v4 généré lors de la création du compte). **Chaque document Firestore dans les collections métier porte un champ `schoolId`.**

### Stratégie de requêtage

Toutes les requêtes incluent obligatoirement le filtre `schoolId` :

```typescript
// CORRECT — toujours filtrer par schoolId
const q = query(
  collection(db, 'eleves'),
  where('schoolId', '==', schoolId),
  where('statut', '==', 'actif')
);

// INCORRECT — ne jamais requêter sans schoolId
const q = query(collection(db, 'eleves')); // Dangereux !
```

### Isolation côté serveur

Les règles Firestore (voir section 7) garantissent l'isolation au niveau de la base de données : même si un développeur oublie le filtre `schoolId` côté client, les règles Firestore empêchent l'accès aux données d'autres établissements.

### SchoolId dans l'auth

Le `schoolId` de l'utilisateur est stocké dans ses **Custom Claims Firebase Auth** :

```javascript
// Claims d'un utilisateur
{
  "uid": "abc123",
  "email": "admin@ecole.fr",
  "customClaims": {
    "role": "admin",
    "schoolId": "school_xyz789"
  }
}
```

Ces claims sont définis côté serveur (Cloud Functions) lors de la création ou modification d'un utilisateur, et ne peuvent pas être modifiés côté client.

---

## 7. Sécurité et règles Firestore

### Principe général

Les règles Firestore sont définies dans `firestore.rules`. Elles constituent la dernière ligne de défense côté base de données. Même si le code client est compromis, les règles empêchent tout accès non autorisé.

### Structure des règles

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Fonctions helper réutilisables
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role;
    }

    function getUserSchoolId() {
      return request.auth.token.schoolId;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    function isAdminOrGestionnaire() {
      return isAuthenticated() &&
             (getUserRole() == 'admin' || getUserRole() == 'gestionnaire');
    }

    function belongsToSchool(schoolId) {
      return isAuthenticated() && getUserSchoolId() == schoolId;
    }

    // Collection élèves
    match /eleves/{eleveId} {
      // Lecture : admin, gestionnaire, prof de l'école, ou l'élève lui-même
      allow read: if isAuthenticated() &&
                     belongsToSchool(resource.data.schoolId);

      // Écriture : admin ou gestionnaire uniquement
      allow write: if isAdminOrGestionnaire() &&
                      belongsToSchool(request.resource.data.schoolId);
    }

    // Collection notes
    match /notes/{noteId} {
      allow read: if isAuthenticated() &&
                     belongsToSchool(resource.data.schoolId);

      // Seul l'admin, le gestionnaire ou le prof auteur peut écrire
      allow write: if isAuthenticated() &&
                      belongsToSchool(request.resource.data.schoolId) &&
                      (isAdminOrGestionnaire() ||
                       request.resource.data.profId == request.auth.uid);
    }

    // Les logs d'audit sont en lecture seule (jamais modifiables)
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Uniquement via Cloud Functions
    }
  }
}
```

### Règle d'or : jamais de writes directs pour les actions sensibles

Les actions sensibles (création de comptes, modification de rôles, suppression de données, etc.) sont **obligatoirement** traitées via des Cloud Functions, jamais directement depuis le client.

---

## 8. Cloud Functions

### Version et région

Les Cloud Functions EduTrack sont développées avec **Firebase Functions v1** (non v2) et déployées dans la région **`europe-west1`**.

```typescript
// functions/src/index.ts — Exemple de configuration
import * as functions from 'firebase-functions/v1';

export const myFunction = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // ...
  });
```

### Structure du répertoire functions

```
functions/
├── src/
│   ├── index.ts              # Point d'entrée — export de toutes les fonctions
│   ├── helpers.auth.ts       # Helpers d'authentification et vérification des rôles
│   ├── helpers.firestore.ts  # Helpers Firestore réutilisables
│   ├── users.functions.ts    # Fonctions liées aux utilisateurs
│   ├── billing.functions.ts  # Fonctions liées à Stripe/facturation
│   ├── notifications.ts      # Envoi de notifications push et email
│   └── audit.ts              # Écriture des logs d'audit
├── package.json
└── tsconfig.json
```

### Helpers d'authentification centralisés

Le fichier `helpers.auth.ts` centralise toutes les vérifications d'authentification pour éviter la duplication :

```typescript
// functions/src/helpers.auth.ts
import * as functions from 'firebase-functions/v1';

export const verifyAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Rôle admin requis');
  }
  return context.auth;
};

export const verifyAdminOrGestionnaire = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
  }
  if (!['admin', 'gestionnaire'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Rôle admin ou gestionnaire requis');
  }
  return context.auth;
};
```

**Règle :** Toujours utiliser ces helpers dans les Cloud Functions — ne jamais dupliquer la logique de vérification.

### Point d'entrée unique pour les appels Cloud Functions

Côté client, tous les appels aux Cloud Functions passent par `src/services/cloudFunctions.ts` :

```typescript
// src/services/cloudFunctions.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app, 'europe-west1');

export const createUser = httpsCallable(functions, 'createUser');
export const toggleUserStatusSecure = httpsCallable(functions, 'toggleUserStatusSecure');
export const sendBulkNotification = httpsCallable(functions, 'sendBulkNotification');
export const generateBulletinPDF = httpsCallable(functions, 'generateBulletinPDF');
export const createStripeCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
// ... tous les autres appels
```

**Règle :** Ne jamais appeler `httpsCallable` directement depuis un composant ou service métier. Toujours passer par `cloudFunctions.ts`.

### Fonctions principales

| Fonction | Description |
|----------|-------------|
| `createUser` | Crée un compte Firebase Auth + document Firestore + définit les Custom Claims |
| `toggleUserStatusSecure` | Active ou désactive un utilisateur (côté serveur pour sécurité) |
| `sendNotification` | Envoie une notification push et/ou email |
| `createStripeCheckoutSession` | Crée une session de paiement Stripe |
| `stripeWebhook` | Traite les événements Stripe (paiements, abonnements) |
| `archiveSchoolYear` | Archive l'année scolaire (opération longue) |
| `generateAuditLog` | Écrit un log dans la collection `audit_logs` |

---

## 9. Authentification

### Firebase Authentication

EduTrack utilise Firebase Authentication avec la méthode **email + mot de passe**.

**Flux d'authentification :**

```
1. Inscription (via Cloud Function createUser)
   Admin → Cloud Function → Firebase Auth createUser → Firestore user doc → Email invitation

2. Connexion
   Utilisateur → Firebase Auth signInWithEmailAndPassword → JWT token → Custom Claims chargés

3. Session
   JWT renouvelé automatiquement toutes les heures par le SDK Firebase
   Custom Claims (role, schoolId) embarqués dans le token → accessibles dans les règles Firestore

4. Déconnexion
   Firebase Auth signOut → Token invalidé → Redirection vers /login
```

### Custom Claims

Les Custom Claims sont des données supplémentaires embedées dans le JWT Firebase :

```json
{
  "role": "prof",
  "schoolId": "school_abc123"
}
```

Ces claims sont **accessibles dans les règles Firestore et les Cloud Functions** sans faire de requête supplémentaire à la base de données.

**Mise à jour des claims :** Les claims sont mis à jour par Cloud Functions (côté serveur uniquement). Après une mise à jour, l'utilisateur doit rafraîchir son token (déconnexion/reconnexion ou `auth.currentUser.getIdToken(true)`).

### Gestion des mots de passe

- Réinitialisation via `sendPasswordResetEmail` Firebase
- Lien valable 24 heures
- La politique de mot de passe (complexité minimale) est vérifiée côté client

---

## 10. Stockage de fichiers

### Firebase Storage

Tous les fichiers binaires sont stockés dans **Firebase Storage** :

| Type de fichier | Path dans Storage |
|----------------|-------------------|
| Photos élèves | `schools/{schoolId}/eleves/{eleveId}/photo.jpg` |
| Photos profs | `schools/{schoolId}/profs/{profId}/photo.jpg` |
| Logo établissement | `schools/{schoolId}/logo.png` |
| Documents RH | `schools/{schoolId}/rh/{profId}/{filename}` |
| Justificatifs | `schools/{schoolId}/presences/{filename}` |
| Ressources LMS | `schools/{schoolId}/lms/{devoirId}/{filename}` |
| Soumissions LMS | `schools/{schoolId}/lms/soumissions/{soumissionId}/{filename}` |

### Règles Storage

Les règles Storage garantissent que seuls les utilisateurs de l'établissement correspondant peuvent lire les fichiers :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /schools/{schoolId}/{allPaths=**} {
      allow read: if request.auth != null &&
                     request.auth.token.schoolId == schoolId;
      allow write: if request.auth != null &&
                      request.auth.token.schoolId == schoolId &&
                      (request.auth.token.role == 'admin' ||
                       request.auth.token.role == 'gestionnaire');
    }
  }
}
```

### Optimisation des images

Les photos uploadées (élèves, profs, logo) sont redimensionnées côté serveur via une Cloud Function déclenchée à l'upload (trigger Storage) :
- Photo élève/prof : 200×200px, qualité 80%
- Logo : 400×200px max, qualité 90%

---

## 11. Intégration Stripe (facturation)

### Architecture de l'intégration

```
Client (navigateur)
    │
    ├── 1. Clic "S'abonner" / "Changer de plan"
    │
    ▼
Cloud Function: createStripeCheckoutSession
    │
    ├── Crée une session Stripe Checkout
    ├── Retourne l'URL de la session
    │
    ▼
Client redirigé vers Stripe Checkout (page Stripe sécurisée)
    │
    ├── Utilisateur saisit ses informations de carte
    │
    ▼
Stripe traite le paiement
    │
    ├── Succès → Redirection vers /billing/success?session_id=xxx
    ├── Abandon → Redirection vers /billing/cancel
    │
    ▼
Stripe envoie un Webhook à Cloud Function: stripeWebhook
    │
    ├── checkout.session.completed → Active l'abonnement dans Firestore
    ├── invoice.payment_failed → Marque le paiement échoué, notifie l'admin
    ├── customer.subscription.deleted → Désactive l'accès
    └── customer.subscription.updated → Met à jour le plan dans Firestore
```

### Gestion des webhooks Stripe

Les webhooks Stripe sont traités par une Cloud Function HTTP (non Callable) :

```typescript
// functions/src/billing.functions.ts — Extrait
export const stripeWebhook = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.CheckoutSession);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      // ... autres événements
    }

    res.json({ received: true });
  });
```

---

## 12. Notifications (Push et Email)

### Firebase Cloud Messaging (FCM) — Push

Les notifications push sont envoyées via FCM depuis les Cloud Functions.

**Enregistrement des tokens FCM :**
1. L'utilisateur autorise les notifications dans le navigateur
2. Le SDK FCM génère un token de périphérique
3. Le token est sauvegardé dans Firestore (document utilisateur)

**Envoi d'une notification :**
```typescript
// functions/src/notifications.ts — Extrait
const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  link?: string
) => {
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;

  if (!fcmToken) return;

  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    webpush: {
      fcmOptions: { link },
    },
  });
};
```

### Emails transactionnels

Les emails (invitations, notifications importantes) sont envoyés depuis les Cloud Functions via le SDK email configuré (SendGrid ou nodemailer + SMTP).

---

## 13. Déploiement et CI/CD

### Prérequis

- Node.js 18+ (LTS)
- Firebase CLI (`npm install -g firebase-tools`)
- Compte Firebase avec projet configuré

### Déploiement du frontend

```bash
# Build de production
npm run build

# Déploiement sur Firebase Hosting
firebase deploy --only hosting
```

Le fichier `vite.config.ts` est configuré pour produire un build optimisé avec :
- Code splitting par route
- Lazy loading des modules
- Compression des assets

### Déploiement des Cloud Functions

```bash
# Déploiement des fonctions uniquement
firebase deploy --only functions

# Déploiement d'une fonction spécifique
firebase deploy --only functions:createUser
```

### Déploiement des règles Firestore et Storage

```bash
# Déploiement des règles Firestore
firebase deploy --only firestore:rules

# Déploiement des index Firestore
firebase deploy --only firestore:indexes

# Déploiement des règles Storage
firebase deploy --only storage
```

### Déploiement complet

```bash
# Tout déployer en une commande
firebase deploy
```

### Variables d'environnement

Les secrets (clés Stripe, SMTP...) sont configurés via Firebase Functions Config ou Google Secret Manager :

```bash
# Configurer les variables d'environnement pour les fonctions
firebase functions:config:set stripe.secret_key="sk_live_xxx"
firebase functions:config:set stripe.webhook_secret="whsec_xxx"
```

Côté frontend (Vite), les variables d'environnement publiques sont dans `.env.local` (non committé) :

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 14. Performance et scalabilité

### Scalabilité Firebase

Firebase est conçu pour scaler automatiquement :
- **Firestore** : scalabilité automatique — pas de configuration requise
- **Cloud Functions** : instanciation automatique en fonction de la charge
- **Firebase Hosting** : CDN mondial — assets servis au plus proche de l'utilisateur

### Optimisations Firestore

**Pagination :** Les listes longues (ex. : liste d'élèves dans un grand établissement) utilisent la pagination Firestore :

```typescript
const q = query(
  collection(db, 'eleves'),
  where('schoolId', '==', schoolId),
  orderBy('nom'),
  limit(50),
  startAfter(lastDocument)  // Cursor-based pagination
);
```

**Dénormalisation :** Pour éviter les jointures (non supportées nativement par Firestore), certaines données sont dénormalisées. Par exemple, le nom de la matière est stocké dans le document `cours` pour éviter une requête supplémentaire à chaque affichage de l'emploi du temps.

**Index composites :** Toutes les requêtes multi-champs nécessitent un index défini dans `firestore.indexes.json`. Un index manquant se traduit par une erreur Firestore avec un lien direct vers la création de l'index.

### Optimisations frontend

**Lazy loading des routes :**
```typescript
const ElevesPage = React.lazy(() => import('./modules/eleves/ElevesPage'));
```

**Memoization :**
Les composants coûteux (listes, tableaux) sont wrappés dans `React.memo`. Les fonctions passées en props sont stabilisées avec `useCallback`.

**Cache Firestore :**
Le SDK Firestore client maintient un cache local. Les données sont servies depuis le cache en attendant la mise à jour réseau (stratégie cache-first).

---

## 15. Patterns de développement

### Règles de développement importantes

**1. Guard sur les résultats de `.find()` :**
```typescript
// INCORRECT — peut crasher si l'élément n'est pas trouvé
const classe = classes.find(c => c.id === classeId);
console.log(classe.nom); // TypeError si classe est undefined

// CORRECT — toujours vérifier avant d'accéder aux propriétés
const classe = classes.find(c => c.id === classeId);
if (classe) {
  console.log(classe.nom);
}
// Ou avec optional chaining :
console.log(classe?.nom);
```

**2. Utiliser les helpers d'auth centralisés :**
```typescript
// INCORRECT — dupliquer la logique de vérification
export const maFonction = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '...');
  if (context.auth.token.role !== 'admin') throw new functions.https.HttpsError('permission-denied', '...');
  // ...
});

// CORRECT — utiliser les helpers
import { verifyAdmin } from './helpers.auth';

export const maFonction = functions.region('europe-west1').https.onCall(async (data, context) => {
  verifyAdmin(context); // Lance une exception si non autorisé
  // ...
});
```

**3. Toujours utiliser `useTheme().colors` pour les styles :**
```typescript
// INCORRECT — valeur codée en dur
const style = { backgroundColor: '#ffffff', color: '#333333' };

// CORRECT — couleurs du thème
const { colors } = useTheme();
const style = { backgroundColor: colors.background, color: colors.text };
```

**4. Ne jamais contourner les Cloud Functions pour les actions sécurisées :**
```typescript
// INCORRECT — modification directe de Firestore depuis le client pour une action admin
await updateDoc(doc(db, 'users', userId), { statut: 'inactif' });

// CORRECT — via Cloud Function sécurisée
import { toggleUserStatusSecure } from '../services/cloudFunctions';
await toggleUserStatusSecure({ userId, statut: 'inactif' });
```

### Convention de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `ElevesPage`, `PaiementCard` |
| Fichiers composants | PascalCase.tsx | `ElevesPage.tsx` |
| Fichiers services | camelCase.service.ts | `eleves.service.ts` |
| Fichiers types | camelCase.types.ts | `eleve.types.ts` |
| Variables / fonctions | camelCase | `getElevesByClasse` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Collections Firestore | camelCase pluriel | `eleves`, `presenceCours` |
| Cloud Functions | camelCase | `createUser`, `toggleUserStatus` |

---

## 16. Monitoring et observabilité

### Firebase Console

Le monitoring de base est disponible directement dans la console Firebase :
- **Functions** : invocations, erreurs, durée d'exécution
- **Firestore** : nombre de lectures/écritures/suppressions
- **Auth** : nombre d'utilisateurs actifs, nouvelles inscriptions
- **Hosting** : trafic, performances CDN
- **Storage** : utilisation, téléchargements

### Logs des Cloud Functions

Les logs sont consultables dans la console Firebase ou via Google Cloud Logging :

```typescript
// Dans une Cloud Function
import * as functions from 'firebase-functions/v1';

functions.logger.info('Utilisateur créé', { userId, schoolId });
functions.logger.error('Erreur Stripe', { error: err.message });
```

### Alertes

Des alertes peuvent être configurées dans Google Cloud Monitoring pour :
- Taux d'erreur des Cloud Functions > seuil
- Latence des fonctions > seuil
- Utilisation excessive du quota Firestore

### Stripe Dashboard

Le tableau de bord Stripe offre une visibilité sur :
- Revenus par plan
- Taux d'échec des paiements
- Abonnements actifs / annulés
- Événements webhook (historique, retry)

---

## Résumé des décisions d'architecture

| Décision | Raison |
|----------|--------|
| Firebase BaaS | Serverless, scalabilité automatique, SDK client puissant, temps réel natif |
| Firestore NoSQL | Flexibilité du schéma, scalabilité horizontale, offline support |
| Cloud Functions v1 | Maturité, compatibilité avec les webhooks HTTP, déjà en production |
| europe-west1 | Conformité RGPD, latence Europe |
| Multi-tenant avec schoolId | Simplicité, une seule collection par entité, facile à requêter |
| Custom Claims Firebase | Rôles et schoolId disponibles partout sans requête supplémentaire |
| TypeScript strict | Réduction des bugs, meilleure maintenabilité, refactoring sûr |
| Styles en ligne + ThemeContext | Personnalisation des couleurs par établissement sans reconstruire l'app |

---

*Documentation Architecture Technique EduTrack — Version 1.0 — Février 2026*
