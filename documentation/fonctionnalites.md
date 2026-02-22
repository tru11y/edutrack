# Fonctionnalités EduTrack — Description Complète

> Ce document décrit en détail chaque module et fonctionnalité de la plateforme EduTrack. Il s'adresse aux décideurs, chefs de projet et toute personne souhaitant évaluer ou présenter les capacités de la plateforme.

---

## Table des matières

1. [Vue d'ensemble des modules](#1-vue-densemble-des-modules)
2. [Tableau de bord et KPIs](#2-tableau-de-bord-et-kpis)
3. [Gestion des élèves](#3-gestion-des-élèves)
4. [Gestion des classes](#4-gestion-des-classes)
5. [Gestion des professeurs](#5-gestion-des-professeurs)
6. [Matières](#6-matières)
7. [Emploi du temps](#7-emploi-du-temps)
8. [Présences et Appel](#8-présences-et-appel)
9. [Évaluations et Notes](#9-évaluations-et-notes)
10. [Bulletins scolaires](#10-bulletins-scolaires)
11. [Paiements et frais de scolarité](#11-paiements-et-frais-de-scolarité)
12. [Comptabilité](#12-comptabilité)
13. [Messagerie interne](#13-messagerie-interne)
14. [Notifications](#14-notifications)
15. [Cahier de texte numérique](#15-cahier-de-texte-numérique)
16. [Discipline](#16-discipline)
17. [Admissions](#17-admissions)
18. [Transport scolaire](#18-transport-scolaire)
19. [Bibliothèque](#19-bibliothèque)
20. [Ressources Humaines (RH)](#20-ressources-humaines-rh)
21. [LMS — Apprentissage en ligne](#21-lms--apprentissage-en-ligne)
22. [Analytics avancées](#22-analytics-avancées)
23. [Journal d'audit et traçabilité](#23-journal-daudit-et-traçabilité)
24. [Archives et corbeille](#24-archives-et-corbeille)
25. [Gestion des utilisateurs et permissions](#25-gestion-des-utilisateurs-et-permissions)
26. [Paramètres de l'établissement](#26-paramètres-de-létablissement)
27. [Abonnement et facturation SaaS](#27-abonnement-et-facturation-saas)

---

## 1. Vue d'ensemble des modules

EduTrack est organisé en **27 modules fonctionnels** couvrant l'intégralité des besoins d'un établissement scolaire moderne. Chaque module est conçu pour fonctionner indépendamment mais aussi de manière interdépendante pour offrir une expérience cohérente.

### Architecture fonctionnelle

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMINISTRATION CENTRALE                       │
│  Élèves │ Classes │ Profs │ Matières │ Utilisateurs │ Paramètres │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   PÉDAGOGIE     │  │   FINANCIER     │  │    OPÉRATIONNEL     │
│ Emploi du temps │  │  Paiements      │  │ Admissions          │
│ Présences       │  │  Comptabilité   │  │ Transport           │
│ Évaluations     │  │  RH / Salaires  │  │ Bibliothèque        │
│ Bulletins       │  │  Facturation    │  │ Discipline          │
│ Cahier de texte │  │                 │  │ Archives            │
│ LMS             │  └─────────────────┘  └─────────────────────┘
└─────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PORTAILS UTILISATEURS                       │
│       Professeur │ Élève │ Parent │ Gestionnaire                 │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSVERSAL                                    │
│   Messagerie │ Notifications │ Analytics │ Audit │ Corbeille     │
└─────────────────────────────────────────────────────────────────┘
```

### Matrice de couverture fonctionnelle

| Domaine | Fonctionnalités clés | Disponible |
|---------|---------------------|:---------:|
| Administration | CRUD élèves, classes, profs, matières | Oui |
| Pédagogie | EDT, présences, notes, bulletins, cahier | Oui |
| Communication | Messagerie, notifications push/email | Oui |
| Finance | Paiements, comptabilité, reçus PDF | Oui |
| RH | Congés, salaires | Oui |
| Admissions | Formulaire public, pipeline Kanban | Oui |
| LMS | Devoirs en ligne, soumissions, corrections | Oui |
| Analytics | Tableaux de bord avancés, exports | Oui |
| Multi-tenant | Isolation des données, personnalisation | Oui |
| SaaS | Plans tarifaires, Stripe, portail billing | Oui |

---

## 2. Tableau de bord et KPIs

### Description

Le tableau de bord est le point d'entrée de l'interface administrative. Il offre une vue panoramique de l'état de l'établissement en temps réel, permettant aux directeurs et gestionnaires de prendre des décisions informées rapidement.

### KPIs affichés

| KPI | Calcul | Utilité |
|-----|--------|---------|
| Nombre d'élèves actifs | Count des élèves avec statut = actif | Suivi des effectifs |
| Nombre de professeurs | Count des profs actifs | Gestion RH |
| Nombre de classes | Classes de l'année en cours | Structure pédagogique |
| Nombre de matières | Matières actives | Offre pédagogique |
| Nombre de salles | Salles déclarées | Capacité d'accueil |
| Taux de couverture paiements | (Paiements reçus / Paiements attendus) × 100 | Santé financière |
| Dépenses du mois | Somme des dépenses du mois courant | Contrôle budgétaire |
| Masse salariale | Somme des salaires du mois | Contrôle RH |

### Graphiques

**LineChart — Tendances des paiements :**
- Période : 6 derniers mois
- Données : montant attendu vs montant reçu par mois
- Permet d'identifier les périodes à problème et de projeter les recettes

**BarChart — Tendances des présences :**
- Période : 4 dernières semaines
- Données : taux de présence moyen par classe, par semaine
- Permet d'identifier les classes avec un absentéisme chronique

**Widget Élèves à risque :**
- Critères configurables : X absences consécutives ET/OU moyenne < seuil
- Liste directement cliquable pour accéder à la fiche de l'élève
- Permet une intervention pédagogique rapide

### Valeur ajoutée

Le tableau de bord transforme les données opérationnelles en intelligence décisionnelle. En moins de 2 minutes, un directeur peut avoir une vision complète de son établissement : effectifs, santé financière, assiduité des élèves et alertes.

---

## 3. Gestion des élèves

### Description

Module central d'EduTrack. La gestion des élèves permet de créer, modifier, consulter et archiver les fiches de tous les élèves inscrits dans l'établissement.

### Fonctionnalités détaillées

**Création et modification :**
- Formulaire de création avec validation des champs obligatoires
- Champs supportés : identité complète, date de naissance, adresse, contacts, classe, photo
- Upload et redimensionnement automatique de la photo de profil
- Lien automatique vers le compte parent si email parent renseigné

**Import CSV en masse :**
- Template CSV téléchargeable pour faciliter la préparation des données
- Validation ligne par ligne avant import
- Rapport d'import : succès / erreurs / doublons détectés
- Import partiel : les lignes valides sont importées même si certaines lignes échouent

**Fiche élève complète :**
La fiche élève est un hub centralisant toutes les informations liées à un élève :

| Onglet | Données disponibles |
|--------|---------------------|
| Informations | Identité, contacts, photo, classe, statut |
| Notes | Toutes les évaluations, moyennes par matière et trimestre |
| Présences | Historique complet présences/absences, taux |
| Paiements | Historique des paiements, solde éventuel |
| Bulletins | Bulletins générés par trimestre |
| Discipline | Incidents enregistrés, sanctions |

**Gestion du statut :**
- Actif : élève visible dans toutes les listes
- Inactif : élève masqué des listes mais données conservées
- Réactivation possible à tout moment

**Recherche et filtres :**
- Recherche plein texte (nom, prénom)
- Filtres par classe, statut, année
- Tri par colonne (nom, classe, date d'inscription)

### Points techniques notables
- La photo est stockée dans Firebase Storage, redimensionnée côté serveur pour optimiser les performances
- L'assignation à une classe est historisée : si un élève change de classe, ses notes antérieures restent liées aux cours de l'ancienne classe

---

## 4. Gestion des classes

### Description

Les classes sont l'unité pédagogique de base d'EduTrack. Elles regroupent les élèves et permettent d'organiser l'emploi du temps, les évaluations et les bulletins.

### Fonctionnalités

**Création et configuration :**
- Nom libre (ex. : "6ème A", "Terminale ES", "Master 1 Info")
- Niveau optionnel pour regrouper les classes (ex. : "Seconde", "Première")
- Professeur principal assignable
- Capacité maximale configurable

**Vue détaillée d'une classe :**
- Liste des élèves inscrits avec leur statut
- Emploi du temps de la classe (grille horaire)
- Liste des professeurs intervenant dans la classe
- Statistiques : taux de présence moyen, moyenne générale, nombre d'évaluations

**Promotion en masse :**
Fonctionnalité de fin d'année permettant de faire passer automatiquement tous les élèves d'une classe vers une classe de niveau supérieur. Paramétrable classe par classe, avec aperçu avant exécution.

**Gestion des redoublants :**
Lors d'une promotion en masse, les élèves marqués comme "redoublants" peuvent être exclus de la promotion et rester dans leur classe actuelle.

---

## 5. Gestion des professeurs

### Description

Ce module gère le personnel enseignant : leurs informations personnelles, leurs matières d'enseignement, leurs cours assignés, et leurs congés.

### Fonctionnalités

**Profil professeur :**
- Informations personnelles (nom, email, téléphone)
- Matières enseignées (sélection multiple)
- Salaire mensuel brut (utilisé pour la comptabilité/RH)
- Date de prise de fonction
- Documents RH (upload de contrats, diplômes)

**Invitation automatique :**
À la création d'un professeur, un email d'invitation est envoyé automatiquement avec un lien de définition de mot de passe.

**Vue du planning :**
Depuis la fiche professeur, accès à son emploi du temps : tous les cours assignés, avec les classes, horaires et salles.

**Statistiques professeur :**
- Nombre d'heures de cours par semaine
- Taux de présence dans ses cours (basé sur les appels faits)
- Nombre d'évaluations créées par trimestre

---

## 6. Matières

### Description

Les matières (disciplines scolaires) sont la base de l'organisation pédagogique. Elles sont utilisées dans l'emploi du temps, les évaluations et les bulletins.

### Fonctionnalités

**Configuration d'une matière :**

| Attribut | Description |
|----------|-------------|
| Nom | Nom complet (ex. : "Mathématiques") |
| Abréviation | Code court pour l'emploi du temps (ex. : "MATHS") |
| Coefficient | Coefficient par défaut dans les bulletins (modifiable par évaluation) |
| Couleur | Code couleur hex pour l'affichage dans la grille horaire |

**Intégrations :**
- **Emploi du temps** : chaque cours est associé à une matière
- **Évaluations** : chaque évaluation appartient à une matière
- **Bulletins** : les moyennes sont calculées par matière avec leur coefficient
- **Cahier de texte** : chaque entrée est associée à une matière
- **Filtres** : toute l'interface permet de filtrer par matière

---

## 7. Emploi du temps

### Description

Le module d'emploi du temps permet de créer et gérer les plannings hebdomadaires des classes et des professeurs, avec détection automatique des conflits.

### Fonctionnalités

**Vues disponibles :**
- Par classe : planning hebdomadaire d'une classe choisie
- Par professeur : planning d'un professeur
- Par salle : occupation d'une salle donnée
- Globale : vue condensée de tous les cours de l'établissement

**Création de cours :**
- Via clic direct sur la grille horaire (préremplit jour et heure)
- Via formulaire complet
- Paramètres : matière, classe, professeur, salle, jour, heure début/fin, récurrence

**Récurrence :**
- Cours hebdomadaire (récurrent toute l'année)
- Cours ponctuel (une seule occurrence)
- Cours avec exceptions (toutes les semaines sauf certaines dates)

**Détection de conflits :**
Vérification automatique en temps réel lors de la création ou modification :
- Conflit de professeur (déjà occupé)
- Conflit de salle (déjà réservée)
- Conflit de classe (cours déjà prévu)

En cas de conflit, affichage du détail : quel cours est en conflit, à quel horaire, avec quelle entité.

**Gestion des salles :**
- Nom/numéro, type, capacité
- Consultation de l'occupation en temps réel
- Filtrage des salles disponibles lors de la création d'un cours

**Modifications :**
- Modifier une occurrence (exceptionnelle) ou toutes les occurrences à venir
- Suppression unitaire ou en masse

---

## 8. Présences et Appel

### Description

Le module de présences centralise l'enregistrement et le suivi de l'assiduité des élèves. Il est utilisé à la fois par les professeurs (qui font l'appel) et par l'administration (supervision et justification).

### Fonctionnalités

**Enregistrement de l'appel :**
- Interface dédiée pour chaque cours/séance
- 3 statuts possibles par élève : Présent, Absent, Retard
- Champ notes par élève (justification préliminaire)
- Enregistrement groupé ou individuel
- Horodatage automatique de la saisie

**Justification des absences :**
- Motifs prédéfinis : Maladie, Convenance personnelle, Décès, Compétition sportive, Autre
- Upload de justificatif (certificat médical, document officiel)
- Statut : Non justifiée / En cours de justification / Justifiée

**Statistiques et rapports :**

| Rapport | Granularité | Période |
|---------|------------|---------|
| Taux de présence par élève | Individuel | Personnalisable |
| Taux de présence par classe | Classe | Personnalisable |
| Taux de présence par matière | Matière | Personnalisable |
| Évolution hebdomadaire | Global / Classe | Par semaine |
| Récapitulatif mensuel | Par élève | Par mois |

**Exports :**
- CSV : données brutes pour traitement externe
- PDF : rapport formaté prêt à imprimer
- Feuille d'appel vierge (pour appel papier en cas de panne)

**Alertes automatiques :**
- Notification au parent dès qu'une absence est enregistrée (si configuré)
- Alerte admin quand un élève dépasse un seuil d'absences configuré

---

## 9. Évaluations et Notes

### Description

Module de gestion des évaluations scolaires, de la création jusqu'à la saisie des notes. Il alimente automatiquement les bulletins et les statistiques académiques.

### Fonctionnalités

**Création d'évaluations :**

Types d'évaluations supportés :
- Contrôle en classe
- Devoir maison (DM)
- Examen de fin de trimestre
- Interrogation orale
- Travaux pratiques (TP)
- Projet
- Évaluation diagnostique

Chaque évaluation est caractérisée par :
- Titre, classe, matière, professeur, date
- Barème (sur 20 par défaut, mais configurable)
- Coefficient pour la moyenne
- Trimestre d'appartenance

**Saisie des notes :**
- Interface par liste d'élèves
- Saisie rapide au clavier (tabulation entre les champs)
- Validation de plage (0 à barème max)
- Statuts spéciaux : Absent, Non rendu, Dispensé
- Appréciation individuelle par élève (texte libre)
- Calcul de la moyenne de classe en temps réel pendant la saisie

**Tableau des notes par classe :**
- Vue matricielle : élèves × matières
- Moyennes calculées automatiquement (par matière, par élève, général)
- Code couleur : rouge < 8, orange 8-12, vert > 12 (seuils configurables)
- Export Excel/CSV du tableau

**Historique et traçabilité :**
- Toute modification de note est tracée (qui, quand, ancienne valeur, nouvelle valeur)
- Consultation de l'historique des modifications depuis la fiche de l'évaluation

---

## 10. Bulletins scolaires

### Description

Le module bulletins génère les relevés de notes officiels par trimestre, avec les appréciations des professeurs, les décisions du conseil de classe et la signature du directeur.

### Fonctionnalités

**Génération automatique :**
- Calcul automatique des moyennes par matière (avec coefficients)
- Calcul de la moyenne générale
- Classement dans la classe (rang)
- Agrégation des appréciations des professeurs

**Contenu du bulletin :**

| Section | Contenu |
|---------|---------|
| En-tête | Logo, nom établissement, année scolaire, trimestre |
| Identité | Nom, prénom, classe de l'élève |
| Tableau des notes | Matière, note, moy. classe, coeff., appréciation prof |
| Synthèse | Moyenne générale, rang, mentions |
| Conseil de classe | Appréciation générale, décision (passage, etc.) |
| Pied de page | Date, cachet et signature du directeur |

**Système de mentions :**
- Félicitations (> 16/20)
- Compliments (14-16/20)
- Encouragements (> 12/20 avec progrès)
- Avertissement de travail
- Avertissement d'assiduité

**Versionning :**
- Chaque bulletin est versionné (v1, v2, v3...)
- La version active est celle affichée aux utilisateurs
- L'historique des versions est conservé et accessible aux admins
- Utile pour les corrections post-publication

**Export PDF :**
- Bulletin individuel (un PDF par élève)
- Classe complète (PDF unique, un bulletin par page)
- Personnalisation du template : logo, couleurs de l'établissement

**Workflow de publication :**
1. Génération (brouillon)
2. Validation par le directeur
3. Publication (visible aux élèves et parents)

---

## 11. Paiements et frais de scolarité

### Description

Module de gestion des frais de scolarité mensuels. Il permet d'enregistrer les paiements, de suivre les impayés, de générer des reçus officiels et de mesurer le taux de recouvrement.

### Fonctionnalités

**Configuration des frais :**
- Montant par classe ou montant unique pour tous
- Mois de facturation (ex. : septembre à juin = 10 mois)
- Modes de paiement acceptés : espèces, chèque, virement, mobile money
- Exonérations individuelles (certains élèves peuvent être exonérés)

**Enregistrement des paiements :**
- Recherche rapide de l'élève
- Saisie du montant, mode, date, référence
- Support des paiements partiels avec solde restant
- Historique complet par élève

**États de paiement :**

| État | Description | Couleur |
|------|-------------|---------|
| Payé | Montant complet reçu | Vert |
| Partiel | Paiement reçu, solde restant | Orange |
| Non payé | Aucun paiement pour ce mois | Rouge |
| Exonéré | Élève exonéré de frais | Gris |

**Reçu PDF :**
- Numéro unique de reçu (séquentiel par établissement)
- Contenu : élève, montant, date, mode de paiement, sceau établissement
- Mention "Reçu pour solde de tout compte" si paiement complet
- Archivage automatique de tous les reçus émis

**Tableau de bord des paiements :**
- Vue mensuelle avec liste complète
- Taux de recouvrement global et par classe
- Montant total attendu vs reçu
- Liste exportable des impayés (pour relance)

**Statistiques financières :**
- Évolution du taux de recouvrement sur 6 mois (graphique)
- Classement des classes par taux de paiement
- Prévision de fin d'année basée sur la tendance

---

## 12. Comptabilité

### Description

Module de comptabilité interne permettant de suivre l'ensemble des flux financiers de l'établissement : recettes (paiements), dépenses, salaires et solde mensuel.

### Fonctionnalités

**Gestion des dépenses :**
- Catégories configurables : fournitures, maintenance, loyer, services externes, équipements, autre
- Upload de justificatifs (factures, bons de commande)
- Vue chronologique et vue par catégorie
- Totaux mensuels et annuels

**Gestion des salaires :**
- Récapitulatif mensuel par employé (professeurs et administratif)
- Marquage du paiement avec date
- Ajustements possibles (primes, déductions) par mois
- Masse salariale totale par mois

**Tableau financier global :**

| Colonne | Calcul |
|---------|--------|
| Recettes | Somme des paiements élèves du mois |
| Dépenses | Somme des dépenses enregistrées |
| Salaires | Masse salariale du mois |
| Résultat | Recettes - Dépenses - Salaires |
| Résultat cumulé | Cumul depuis le début de l'année |

**Exports comptables :**
- CSV standard pour intégration dans un logiciel comptable
- PDF du rapport mensuel
- Rapport annuel de synthèse

---

## 13. Messagerie interne

### Description

Système de messagerie intégré permettant la communication entre tous les acteurs de l'établissement sans sortir de la plateforme.

### Fonctionnalités

**Composition de messages :**
- Champ "À" avec autocomplétion sur tous les utilisateurs de l'établissement
- Groupes prédéfinis : tous les professeurs, parents d'une classe, élèves d'une classe
- Objet et corps du message (éditeur riche avec mise en forme)
- Pièces jointes (PDF, images, documents — max 10 Mo par fichier)

**Organisation de la boîte :**
- Réception (messages reçus)
- Envoyés (copies)
- Archivés (gestion manuelle)
- Corbeille (conservation 30 jours)
- Indication de lecture : horodatage de l'ouverture

**Règles de communication par rôle :**

| Émetteur | Peut écrire à |
|----------|--------------|
| Admin | Tout le monde |
| Gestionnaire | Tout le monde |
| Professeur | Admin, gestionnaires, autres profs, élèves de ses classes, parents de ses classes |
| Élève | Professeurs, admin, gestionnaires |
| Parent | Professeurs de son enfant, admin, gestionnaires |

**Notifications :**
- Notification push ou email (selon configuration) dès la réception d'un message
- Indicateur de non-lus dans la navigation principale

---

## 14. Notifications

### Description

Système de notifications multicanal (push navigateur + email) permettant d'informer en temps réel les utilisateurs des événements les concernant.

### Canaux

**Push navigateur (Web Push) :**
- Fonctionne même lorsque l'application est en arrière-plan
- Compatible Chrome, Firefox, Edge, Safari (macOS)
- Activation opt-in par l'utilisateur (consentement requis)
- Contenu : titre + message + lien direct vers l'élément concerné

**Email :**
- Email transactionnel envoyé à l'adresse de connexion
- Template personnalisé avec logo de l'établissement
- Liens cliquables directs vers le contenu

### Événements déclencheurs

| Événement | Destinataires | Push | Email |
|-----------|--------------|:----:|:-----:|
| Absence enregistrée | Parent | Oui | Oui |
| Note publiée | Élève + Parent | Oui | Non |
| Bulletin disponible | Élève + Parent | Oui | Oui |
| Paiement en retard (J+5) | Parent | Non | Oui |
| Message reçu | Destinataire | Oui | Optionnel |
| Devoir rendu (LMS) | Professeur | Oui | Non |
| Candidature reçue | Admin + Gestionnaire | Oui | Non |
| Congé approuvé/refusé | Professeur | Oui | Oui |

### Configuration

L'admin configure au niveau de l'établissement quels événements déclenchent quelle notification. Chaque utilisateur peut ensuite désactiver individuellement les notifications qu'il ne souhaite pas recevoir.

---

## 15. Cahier de texte numérique

### Description

Version numérique du cahier de texte traditionnel. Les professeurs y consignent le contenu de chaque séance (leçon, chapitre traité) et les travaux à faire (devoirs). Il est consultable en temps réel par les élèves, parents et l'administration.

### Fonctionnalités

**Création d'une entrée :**
- Sélection du cours (classe + matière + date)
- Champ "Contenu de la séance" : éditeur riche (gras, listes, titres)
- Champ "Travail à faire" : devoirs avec date limite
- Pièces jointes : ressources pédagogiques (PDF, images, liens)
- Commentaire interne (visible par l'administration uniquement)

**Consultation :**
- Navigation par semaine avec flèches de navigation
- Filtres par classe et par matière
- Vue compacte (liste) ou vue détaillée (contenu complet)
- Recherche textuelle dans le contenu

**Accès par rôle :**

| Rôle | Droits |
|------|--------|
| Admin / Gestionnaire | Voir tout, créer, modifier, supprimer |
| Professeur | Voir ses cours, créer/modifier ses entrées |
| Élève | Voir les entrées de ses cours |
| Parent | Voir les entrées des cours de son enfant |

**Versionning des bulletins (lien) :**
Les devoirs enregistrés dans le cahier de texte peuvent être liés à des évaluations créées dans le module Notes, pour une traçabilité complète.

---

## 16. Discipline

### Description

Module de gestion des incidents disciplinaires, sanctions et suivi comportemental des élèves.

### Fonctionnalités

**Types d'incidents :**
- Retard répété
- Insolence ou manque de respect
- Absence injustifiée
- Violence physique ou verbale
- Triche ou plagiat
- Dégradation de matériel
- Autre (champ libre)

**Mesures disciplinaires :**
- Avertissement oral
- Avertissement écrit
- Retenue
- Exclusion temporaire (durée)
- Convocation des parents
- Exclusion définitive (action admin uniquement)

**Suivi :**
- Statut : En cours / Résolu / Classé sans suite
- Historique complet par élève
- Lien vers le compte rendu (document upload)
- Signalement par qui (professeur, gestionnaire, admin)

**Vue statistique :**
- Nombre d'incidents par type, par classe, par mois
- Élèves avec le plus d'incidents
- Tendances temporelles

---

## 17. Admissions

### Description

Module de gestion du processus d'admission de nouveaux élèves, de la candidature publique jusqu'à l'inscription définitive dans le système.

### Fonctionnalités

**Formulaire public d'admission :**
- URL publique unique par établissement
- Accessible sans compte
- Champs : identité élève, classe souhaitée, infos parents, documents
- Upload de documents justificatifs (bulletins, actes de naissance)
- Confirmation par email automatique au candidat

**Pipeline Kanban :**

```
┌──────────┐  ┌──────────────────┐  ┌────────────────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐
│ Nouveau  │→ │ En cours d'examen│→ │ Entretien planifié │→ │ Accepté  │→ │ Refusé  │  │ Inscrit │
└──────────┘  └──────────────────┘  └────────────────────┘  └──────────┘  └─────────┘  └─────────┘
```

- Déplacement par glisser-déposer ou changement de statut
- Commentaires internes sur chaque candidature
- Notifications automatiques au candidat à chaque changement de statut

**Conversion en élève :**
Depuis une candidature acceptée, conversion en un clic vers une fiche élève complète, avec toutes les données pré-remplies.

**Statistiques d'admissions :**
- Nombre de candidatures reçues par période
- Taux d'acceptation
- Temps moyen de traitement
- Capacités restantes par classe

---

## 18. Transport scolaire

### Description

Module de gestion des lignes de bus scolaires et de l'affectation des élèves aux routes de transport.

### Fonctionnalités

**Gestion des routes :**
- Nom et description de la route
- Points d'arrêt avec horaires (matin + soir)
- Véhicule assigné (plaque, type)
- Conducteur responsable
- Capacité du véhicule

**Affectation des élèves :**
- Assignation d'un élève à une route et un point d'arrêt
- Vue par route : liste des élèves transportés
- Vue par élève : sa route et son arrêt

**Gestion des changements :**
- Modification d'affectation en cours d'année
- Historique des affectations

---

## 19. Bibliothèque

### Description

Module de gestion du fonds documentaire de l'établissement et des emprunts d'élèves.

### Fonctionnalités

**Catalogue :**
- Fiche livre : titre, auteur, ISBN, éditeur, année, catégorie, nombre d'exemplaires
- Recherche par titre, auteur ou ISBN
- Statut de disponibilité (exemplaires disponibles / empruntés)
- Code-barres ou QR code (si équipement)

**Gestion des emprunts :**
- Enregistrement emprunt : élève + livre + date retour prévue
- Rappels automatiques avant date de retour (notification)
- Retour avec vérification de l'état
- Amende en cas de retard (optionnel)

**Statistiques :**
- Livres les plus empruntés
- Élèves les plus actifs
- Durée moyenne d'emprunt
- Taux de retour dans les délais

---

## 20. Ressources Humaines (RH)

### Description

Module de gestion des demandes de congé du personnel et de suivi des présences du corps enseignant.

### Fonctionnalités

**Gestion des congés :**
- Demande par le professeur (type, dates, motif, justificatif)
- Validation / Refus par l'administration avec commentaire
- Notifications automatiques aux deux parties
- Calendrier des congés approuvés (évite les conflits)
- Vérification automatique des cours impactés par le congé

**Types de congés :**
- Congé maladie
- Congé personnel
- Formation professionnelle
- Congé maternité / paternité
- Autre

**Solde de congés :**
- Compteur de jours de congé par employé (configurable)
- Décompte automatique à chaque congé approuvé
- Vue du solde restant

**Intégration emploi du temps :**
Si un professeur est en congé, ses cours peuvent être marqués comme "annulés" ou "remplacés" dans l'emploi du temps, avec notification automatique aux classes concernées.

---

## 21. LMS — Apprentissage en ligne

### Description

Le Learning Management System (LMS) permet la gestion des devoirs et activités en ligne : création par le professeur, remise par l'élève, correction et notation.

### Fonctionnalités

**Création de devoirs (professeur) :**
- Titre, consigne (éditeur riche), matière, classe
- Date limite de remise avec heure
- Mode de remise : fichier upload, texte en ligne, lien URL
- Ressources jointes (documents, vidéos, liens)
- Barème de notation

**Remise des devoirs (élève) :**
- Vue des devoirs actifs avec statut et date limite
- Upload de fichier ou saisie directe selon le mode
- Confirmation de remise avec horodatage (preuve légale)
- Impossibilité de modifier après remise (selon configuration)
- Alerte si proche de la date limite

**Correction et notation (professeur) :**
- Liste des soumissions par devoir
- Consultation de chaque travail rendu
- Saisie de la note et du commentaire de correction
- Retour direct à l'élève (visible dans son portail)
- Option de rendu annoté (upload du document corrigé)

**Suivi (admin) :**
- Taux de remise par devoir (% d'élèves ayant rendu)
- Statistiques de notes LMS
- Intégration avec les évaluations (les notes LMS alimentent le module Notes)

---

## 22. Analytics avancées

### Description

Tableaux de bord approfondis pour analyser les performances de l'établissement sur tous les axes : académique, assiduité, financier.

### Rapports disponibles

**Performance académique :**
- Évolution des moyennes par classe sur les trimestres
- Distribution des notes (histogramme) par matière
- Taux de réussite (% > 10/20) par matière
- Comparaison entre classes de même niveau

**Absentéisme :**
- Taux d'absence par classe, par matière, par jour de la semaine
- Élèves avec le taux d'absentéisme le plus élevé
- Corrélation absence / résultats académiques

**Financier :**
- Évolution du taux de recouvrement sur 12 mois
- Dépenses par catégorie (graphique circulaire)
- Projection de fin d'année

**Comparatif :**
- Comparaison d'une classe par rapport à la précédente année
- Évolution d'un élève sur plusieurs trimestres

**Alertes automatiques :**
- Élèves dont la moyenne chute de plus de X points entre deux trimestres
- Classes dont le taux de présence est anormalement bas

### Formats d'export

| Format | Usage |
|--------|-------|
| PDF | Rapport formaté pour impression ou présentation |
| CSV | Données brutes pour traitement dans Excel |
| Excel | Tableau avec graphiques intégrés |

---

## 23. Journal d'audit et traçabilité

### Description

Le journal d'audit enregistre toutes les actions effectuées sur la plateforme par tous les utilisateurs. Il est immuable (lecture seule) et constitue la mémoire légale de l'établissement.

### Données tracées

| Action | Exemple |
|--------|---------|
| Création | "Élève Pierre Martin créé par admin@ecole.fr" |
| Modification | "Note modifiée : 12→14 pour Évaluation #42 par prof@ecole.fr" |
| Suppression | "Cours Mathématiques 6A Lundi 8h supprimé par admin@ecole.fr" |
| Connexion | "Connexion réussie de parent@email.com depuis IP 91.x.x.x" |
| Export | "Export CSV présences - Classes 6A par gestionnaire@ecole.fr" |
| Paiement | "Paiement 150€ enregistré pour Pierre Martin - Octobre par gestionnaire" |

### Informations par entrée

- Timestamp précis (date + heure au millième de seconde)
- Identité de l'utilisateur auteur
- Rôle de l'utilisateur au moment de l'action
- Type d'action (création, modification, suppression, connexion, export)
- Module concerné
- Détail de l'action (ancien/nouveau contenu pour les modifications)
- Adresse IP (pour les actions sensibles)

### Recherche et filtres

- Filtres : utilisateur, type d'action, module, période
- Recherche textuelle dans les détails
- Export du journal (CSV) pour audit externe

---

## 24. Archives et corbeille

### Description

Fonctionnalités de gestion du cycle de vie des données : archivage de fin d'année et corbeille avec restauration.

### Archives

**Processus d'archivage annuel :**
- Déclenchement manuel par l'admin en fin d'année
- Checklist de vérification avant archivage
- Toutes les données de l'année sont figées en lecture seule
- L'année courante est réinitialisée (vide) pour la nouvelle rentrée
- Les classes et élèves restent actifs (à promouvoir manuellement)

**Consultation des archives :**
- Toutes les données historiques consultables (lecture seule)
- Navigation par année scolaire archivée
- Exports possibles depuis les archives

### Corbeille

**Éléments concernés :**
- Élèves désactivés
- Cours supprimés
- Documents effacés
- Évaluations supprimées

**Comportement :**
- Durée de conservation : 90 jours
- Restauration en un clic
- Suppression définitive manuelle (admin uniquement) ou automatique après 90 jours
- Avertissement avant toute suppression définitive

---

## 25. Gestion des utilisateurs et permissions

### Description

Module de gestion des comptes utilisateurs de l'établissement, avec contrôle fin des droits d'accès.

### Rôles et permissions

**Rôle Admin :**
Accès total à toutes les fonctionnalités de l'établissement, y compris :
- Paramètres de l'établissement
- Gestion de l'abonnement et de la facturation
- Journal d'audit
- Archives
- Création / désactivation de tous les utilisateurs

**Rôle Gestionnaire :**
Accès opérationnel étendu, sauf :
- Paramètres de l'établissement (lecture seule)
- Gestion abonnement
- Journal d'audit
- Archives

**Rôle Professeur :**
Accès limité aux fonctionnalités pédagogiques de ses classes :
- Ses cours uniquement dans l'emploi du temps
- Ses élèves (classes où il enseigne)
- Présences de ses cours
- Ses évaluations

**Rôle Élève :**
Lecture seule sur ses données personnelles :
- Ses notes et bulletins
- Son emploi du temps
- Ses présences
- Ses devoirs LMS

**Rôle Parent :**
Lecture seule sur les données de son enfant :
- Notes, présences, emploi du temps, bulletins de l'enfant
- Paiements associés à l'enfant
- Cahier de texte de l'enfant

### Permissions granulaires

Au-delà des rôles standards, l'admin peut ajuster finement les permissions individuelles :
- Activer ou désactiver l'accès à certains modules pour un utilisateur
- Accorder des droits d'écriture supplémentaires (ex. : prof ayant accès aux paiements)
- Restreindre l'accès (ex. : gestionnaire ne pouvant pas voir les notes)

---

## 26. Paramètres de l'établissement

### Description

Configuration globale de l'établissement : identité visuelle, année scolaire, paramètres pédagogiques.

### Paramètres disponibles

**Identité :**
- Nom officiel de l'établissement
- Logo (PNG/JPG, max 2 Mo)
- Couleur principale et couleur secondaire
- Adresse, téléphone, email, site web

**Année scolaire :**
- Label de l'année (ex. : "2025-2026")
- Dates de début et fin
- Dates des trimestres (3 trimestres ou 2 semestres)
- Périodes de vacances

**Personnalisation pédagogique :**
- Barème par défaut des évaluations
- Seuils de mention (félicitations, etc.)
- Nombre de trimestres
- Notation sur 20 (par défaut) ou autre

**Intégrations :**
- Configuration email (SMTP pour emails transactionnels)
- Configuration notifications push (FCM)

---

## 27. Abonnement et facturation SaaS

### Description

Module de gestion de l'abonnement à la plateforme EduTrack, intégré avec Stripe pour la facturation automatique.

### Plans disponibles

| Plan | Prix | Élèves max | Stockage | Support |
|------|------|:----------:|:--------:|---------|
| Starter | Gratuit | 50 | 1 Go | Email |
| Basic | 29€/mois | 200 | 5 Go | Email |
| Pro | 79€/mois | 500 | 20 Go | Prioritaire |
| Enterprise | 199€/mois | Illimité | 100 Go | Dédié |

### Fonctionnalités de facturation

**Portail de gestion :**
- Vue de l'abonnement actuel
- Compteur d'élèves actifs vs limite
- Date de prochain renouvellement
- Historique des factures (téléchargement PDF)

**Changement de plan :**
- Upgrade immédiat avec facturation au prorata
- Downgrade à la prochaine échéance
- Confirmation sécurisée via Stripe

**Facturation :**
- Paiement mensuel par carte bancaire (via Stripe)
- Factures automatiques envoyées par email
- Portail Stripe Customer Portal pour gérer la carte, les factures

**Alertes :**
- Alerte 80% de la limite d'élèves atteinte
- Alerte paiement échoué avec lien de mise à jour de carte

---

*Documentation Fonctionnalités EduTrack — Version 1.0 — Février 2026*
