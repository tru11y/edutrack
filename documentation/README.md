# Documentation EduTrack — Index Général

> **EduTrack** est une plateforme SaaS de gestion scolaire multi-établissements, conçue pour les écoles privées, les établissements d'enseignement supérieur et les centres de formation. Elle centralise l'administration, la pédagogie, la communication et la comptabilité dans un seul outil accessible en ligne.

---

## Table des matières

| Document | Description | Public cible |
|----------|-------------|--------------|
| [Guide Administrateur](./guide-admin.md) | Toutes les fonctionnalités côté admin, étape par étape | Directeurs, administrateurs d'établissement |
| [Guide Utilisateurs](./guide-utilisateurs.md) | Portails par rôle : gestionnaire, professeur, élève, parent | Tous les utilisateurs finaux |
| [Fonctionnalités](./fonctionnalites.md) | Description détaillée de chaque module fonctionnel | Chefs de projet, décideurs |
| [Abonnements SaaS](./saas-abonnements.md) | Plans tarifaires, facturation, limites, Stripe | Directeurs, comptables |
| [Architecture Technique](./architecture-technique.md) | Stack, Firebase, multi-tenant, sécurité, déploiement | Équipes techniques, DSI |

---

## Présentation de la plateforme

### Qu'est-ce qu'EduTrack ?

EduTrack est une solution de gestion scolaire en mode SaaS (Software as a Service). Chaque établissement dispose de son propre espace isolé, configuré à son image (logo, couleurs, nom), tout en bénéficiant d'une infrastructure partagée et maintenue par l'équipe EduTrack.

La plateforme couvre l'intégralité du cycle de vie scolaire :

- **Avant l'inscription** : formulaire d'admissions public, pipeline de candidatures
- **Pendant l'année** : emplois du temps, présences, évaluations, communications, comptabilité
- **En fin d'année** : bulletins, archivage, transition vers la nouvelle année

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `superadmin` | Propriétaire de la plateforme EduTrack — gère tous les établissements |
| `admin` | Directeur ou propriétaire d'un établissement — accès complet à son école |
| `gestionnaire` | Secrétaire ou assistant administratif — accès étendu sans certaines actions critiques |
| `prof` | Enseignant — portail dédié : appel, notes, cahier de texte, évaluations |
| `eleve` | Étudiant — portail lecture seule : notes, présences, emploi du temps, bulletins |
| `parent` | Parent d'élève — portail lecture seule : suivi de l'enfant, paiements |

### Modules principaux

```
EduTrack
├── Administration
│   ├── Tableau de bord (KPIs + graphiques)
│   ├── Élèves (CRUD, import CSV, photos)
│   ├── Classes & Promotions
│   ├── Professeurs
│   ├── Matières
│   ├── Emploi du temps
│   ├── Présences
│   ├── Évaluations & Notes
│   ├── Bulletins (PDF)
│   ├── Paiements & Comptabilité
│   ├── Messagerie interne
│   ├── Notifications (push/email)
│   ├── Cahier de texte
│   ├── Discipline
│   ├── Admissions
│   ├── Transport
│   ├── Bibliothèque
│   ├── Ressources Humaines
│   ├── LMS (devoirs en ligne)
│   ├── Analytics avancées
│   ├── Journal d'audit
│   ├── Archives & Corbeille
│   └── Paramètres établissement
│
├── Portail Professeur
│   ├── Tableau de bord
│   ├── Mes élèves
│   ├── Appel / Présences
│   ├── Cahier de texte
│   ├── Évaluations & Notes
│   └── Messagerie
│
├── Portail Élève
│   ├── Tableau de bord personnel
│   ├── Mes notes
│   ├── Mes présences
│   ├── Mon emploi du temps
│   └── Mes bulletins
│
└── Portail Parent
    ├── Suivi de l'enfant
    ├── Notes & Présences
    ├── Emploi du temps
    ├── Bulletins
    ├── Cahier de texte
    └── Paiements
```

---

## Démarrage rapide

### Pour un nouvel établissement

1. Choisissez votre plan sur [edutrack.app](https://edutrack.app)
2. Créez votre compte administrateur (email + mot de passe)
3. Configurez votre établissement : nom, logo, couleurs (Paramètres)
4. Créez vos matières, puis vos classes
5. Importez vos élèves (CSV ou création manuelle)
6. Ajoutez vos professeurs et assignez-les aux matières
7. Créez l'emploi du temps
8. Invitez vos utilisateurs (professeurs, élèves, parents)

### Pour un utilisateur existant

Accédez à votre portail via l'URL fournie par votre établissement. Connectez-vous avec les identifiants qui vous ont été communiqués par email.

---

## Support et contact

Pour toute question technique ou commerciale, contactez l'équipe EduTrack via la messagerie intégrée (réservée aux superadmins) ou par email à support@edutrack.app.

---

## Versions de la documentation

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Février 2026 | Documentation initiale complète |

---

*Documentation EduTrack — Dernière mise à jour : Février 2026*
