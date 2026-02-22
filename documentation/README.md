# EduTrack — Documentation

> **EduTrack** est une plateforme de gestion scolaire en ligne, conçue pour les établissements privés. Elle centralise l'administration, la pédagogie, la communication et la comptabilité.

---

## Documents disponibles

| Document | Public cible |
|----------|--------------|
| [Fonctionnalités](./fonctionnalites.md) | Directeurs, décideurs |
| [Guide Administrateur](./guide-admin.md) | Directeurs, administrateurs |
| [Guide Utilisateurs](./guide-utilisateurs.md) | Professeurs, élèves, parents |
| [Architecture Technique](./architecture-technique.md) | Équipes techniques |

---

## Rôles

| Rôle | Accès |
|------|-------|
| `admin` | Accès complet à l'établissement |
| `gestionnaire` | Accès opérationnel (sans paramètres critiques) |
| `prof` | Portail pédagogique : appel, notes, cahier de texte |
| `eleve` | Portail lecture seule : notes, présences, emploi du temps, bulletins |
| `parent` | Portail lecture seule : suivi de l'enfant, paiements |

---

## Modules

```
EduTrack
├── Administration
│   ├── Tableau de bord (KPIs + graphiques + recommandations)
│   ├── Élèves (CRUD, import CSV)
│   ├── Classes & Promotion de fin d'année
│   ├── Matières
│   ├── Emploi du temps (avec détection de conflits)
│   ├── Présences & Appel
│   ├── Évaluations & Notes
│   ├── Bulletins PDF (versionning)
│   ├── Paiements & Reçus PDF
│   ├── Comptabilité (dépenses, salaires)
│   ├── Messagerie interne
│   ├── Notifications (push/email)
│   ├── Cahier de texte numérique
│   ├── Discipline
│   ├── Analytics avancées
│   ├── Journal d'audit
│   ├── Archives & Corbeille
│   ├── Gestion des utilisateurs & Permissions
│   └── Paramètres établissement
│
├── Portail Professeur
│   ├── Tableau de bord
│   ├── Appel / Présences
│   ├── Cahier de texte
│   ├── Évaluations & Notes
│   └── Messagerie
│
├── Portail Élève
│   ├── Notes & Bulletins
│   ├── Présences
│   └── Emploi du temps
│
└── Portail Parent
    ├── Notes, Présences, Bulletins de l'enfant
    ├── Emploi du temps
    ├── Cahier de texte
    └── Paiements
```

---

## Démarrage rapide

1. Connectez-vous avec vos identifiants administrateur
2. **Paramètres** → configurez le nom, logo et couleurs de l'établissement
3. **Matières** → créez les disciplines enseignées
4. **Classes** → créez les classes de l'établissement
5. **Élèves** → importez vos élèves (CSV) ou créez-les manuellement
6. **Utilisateurs** → invitez vos professeurs
7. **Emploi du temps** → planifiez les cours

---

*EduTrack — Dernière mise à jour : Février 2026*
