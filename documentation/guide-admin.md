# Guide Administrateur EduTrack

> Ce guide s'adresse aux **administrateurs d'établissement** (directeurs, propriétaires d'école) et aux **gestionnaires** (secrétaires, assistants administratifs). Il détaille toutes les fonctionnalités disponibles dans l'interface d'administration, étape par étape.

---

## Table des matières

1. [Première connexion et configuration initiale](#1-première-connexion-et-configuration-initiale)
2. [Tableau de bord](#2-tableau-de-bord)
3. [Gestion des élèves](#3-gestion-des-élèves)
4. [Gestion des classes](#4-gestion-des-classes)
5. [Gestion des professeurs](#5-gestion-des-professeurs)
6. [Gestion des matières](#6-gestion-des-matières)
7. [Emploi du temps](#7-emploi-du-temps)
8. [Présences](#8-présences)
9. [Évaluations et notes](#9-évaluations-et-notes)
10. [Bulletins scolaires](#10-bulletins-scolaires)
11. [Paiements](#11-paiements)
12. [Comptabilité](#12-comptabilité)
13. [Messagerie interne](#13-messagerie-interne)
14. [Notifications](#14-notifications)
15. [Cahier de texte](#15-cahier-de-texte)
16. [Discipline](#16-discipline)
17. [Admissions](#17-admissions)
18. [Transport](#18-transport)
19. [Bibliothèque](#19-bibliothèque)
20. [Ressources Humaines](#20-ressources-humaines)
21. [LMS — Apprentissage en ligne](#21-lms--apprentissage-en-ligne)
22. [Analytics avancées](#22-analytics-avancées)
23. [Journal d'audit](#23-journal-daudit)
24. [Archives et corbeille](#24-archives-et-corbeille)
25. [Gestion des utilisateurs](#25-gestion-des-utilisateurs)
26. [Paramètres de l'établissement](#26-paramètres-de-létablissement)
27. [Abonnement et facturation](#27-abonnement-et-facturation)

---

## 1. Première connexion et configuration initiale

### 1.1 Accès à la plateforme

Après création de votre compte (via le site EduTrack ou invitation par le superadmin), vous recevez un email de bienvenue contenant :
- L'URL de votre portail (ex. : `https://edutrack.app/login`)
- Votre adresse email de connexion
- Un lien de définition de mot de passe (valable 24h)

**Étapes de première connexion :**

1. Cliquez sur le lien de définition de mot de passe reçu par email
2. Choisissez un mot de passe sécurisé (minimum 8 caractères, avec majuscule, chiffre et caractère spécial)
3. Confirmez le mot de passe
4. Vous êtes redirigé automatiquement vers votre tableau de bord admin

### 1.2 Assistant de configuration initiale (Onboarding)

Au premier accès, un assistant de configuration vous guide en 4 étapes :

**Étape 1 — Informations de l'établissement**
- Nom complet de l'établissement
- Ville et pays
- Numéro de téléphone
- Email de contact

**Étape 2 — Identité visuelle**
- Upload du logo (formats PNG, JPG, SVG — max 2 Mo)
- Couleur primaire (sélecteur de couleur hexadécimal)
- Couleur secondaire

**Étape 3 — Structure pédagogique**
- Création des premières matières (vous pourrez en ajouter d'autres plus tard)
- Création des premières classes

**Étape 4 — Invitation des utilisateurs**
- Invitation de vos professeurs par email
- Option d'import CSV pour les élèves

> **Conseil :** Même si vous pouvez sauter l'assistant, il est recommandé de le compléter entièrement avant d'inviter vos premiers utilisateurs. Cela garantit une expérience cohérente dès le départ.

---

## 2. Tableau de bord

### 2.1 Vue d'ensemble

Le tableau de bord est la page d'accueil de l'interface admin. Il présente une synthèse de l'activité de l'établissement en temps réel.

**Accès :** Menu latéral > Tableau de bord (icône maison)

### 2.2 Indicateurs KPI

Les KPIs (Key Performance Indicators) sont affichés sous forme de cartes en haut de la page :

| KPI | Description |
|-----|-------------|
| Nombre d'élèves | Total des élèves actifs inscrits |
| Nombre de professeurs | Total des professeurs actifs |
| Nombre de classes | Classes actives de l'année en cours |
| Nombre de matières | Matières enseignées |
| Nombre de salles | Salles déclarées dans l'établissement |
| Taux de couverture paiements | % des paiements du mois reçus vs attendus |
| Dépenses du mois | Total des dépenses enregistrées ce mois |
| Masse salariale | Total des salaires du mois |

Chaque carte affiche également une tendance (flèche verte/rouge) comparant la valeur actuelle au mois précédent.

### 2.3 Graphiques

**Graphique 1 — Tendances des paiements (LineChart)**
- Axe X : 6 derniers mois
- Axe Y : montant en euros
- Deux courbes : paiements reçus vs paiements attendus
- Permet d'identifier les périodes de faible recouvrement

**Graphique 2 — Tendances des présences (BarChart)**
- Axe X : 4 dernières semaines
- Axe Y : % de présence moyen
- Barres groupées par classe
- Identifie rapidement les classes avec un taux d'absentéisme élevé

**Widget — Élèves à risque**
- Liste des élèves avec plus de 3 absences non justifiées consécutives OU une moyenne inférieure à 8/20
- Clic sur un élève : ouvre sa fiche complète
- Permet une intervention rapide des équipes pédagogiques

### 2.4 Raccourcis rapides

En bas du tableau de bord, des boutons de raccourci permettent d'accéder directement aux actions les plus fréquentes :
- Ajouter un élève
- Faire l'appel
- Enregistrer un paiement
- Créer un message

---

## 3. Gestion des élèves

### 3.1 Liste des élèves

**Accès :** Menu latéral > Élèves

La liste affiche tous les élèves actifs avec :
- Photo (si renseignée)
- Nom et prénom
- Classe assignée
- Statut (actif / inactif)
- Date d'inscription

**Filtres disponibles :**
- Par classe
- Par statut (actif/inactif)
- Recherche par nom ou prénom

**Tri :** Par nom, par classe, par date d'inscription

### 3.2 Créer un élève manuellement

1. Cliquez sur **+ Ajouter un élève**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|------------|-------------|
| Prénom | Oui | Prénom de l'élève |
| Nom | Oui | Nom de famille |
| Date de naissance | Oui | Format JJ/MM/AAAA |
| Classe | Oui | Sélection parmi les classes créées |
| Email | Non | Email personnel (utilisé pour le compte élève) |
| Téléphone | Non | Numéro de téléphone |
| Adresse | Non | Adresse complète |
| Nom du parent | Non | Nom du/des parent(s) |
| Email du parent | Non | Utilisé pour créer le compte parent |
| Photo | Non | Upload JPG/PNG (max 1 Mo, redimensionnée automatiquement) |

3. Cliquez sur **Enregistrer**
4. Si un email élève est renseigné, une invitation lui est envoyée automatiquement
5. Si un email parent est renseigné, une invitation parent lui est envoyée également

### 3.3 Importer des élèves via CSV

L'import CSV permet d'ajouter plusieurs dizaines ou centaines d'élèves en une seule opération.

**Étapes d'import :**

1. Cliquez sur **Importer CSV**
2. Téléchargez le modèle CSV en cliquant sur **Télécharger le modèle**
3. Ouvrez le fichier modèle dans Excel ou LibreOffice Calc
4. Complétez les colonnes (voir format ci-dessous)
5. Sauvegardez en format CSV (UTF-8)
6. Glissez-déposez le fichier sur la zone d'upload ou cliquez pour le sélectionner
7. Vérifiez l'aperçu des données importées
8. Cliquez sur **Confirmer l'import**

**Format du fichier CSV :**

```
prenom,nom,date_naissance,classe,email,email_parent,telephone
Marie,Dupont,15/03/2010,6ème A,marie.dupont@email.com,parent.dupont@email.com,0612345678
Paul,Martin,22/07/2009,5ème B,,parent.martin@email.com,
```

**Règles d'import :**
- La première ligne doit être l'en-tête (noms des colonnes)
- Les colonnes `prenom`, `nom`, `classe` sont obligatoires
- La colonne `classe` doit correspondre exactement au nom d'une classe existante
- Les doublons (même prénom + nom + date de naissance) sont détectés et signalés
- En cas d'erreur sur une ligne, les autres lignes valides sont quand même importées

**Résultat de l'import :**
Un rapport s'affiche avec :
- Nombre d'élèves importés avec succès
- Nombre de lignes en erreur (avec détail des erreurs)
- Option d'export du rapport d'erreurs

### 3.4 Modifier un élève

1. Cliquez sur l'élève dans la liste
2. La fiche complète de l'élève s'ouvre (vue tabulée)
3. Cliquez sur **Modifier** (icône crayon)
4. Modifiez les champs souhaités
5. Cliquez sur **Enregistrer**

**Onglets de la fiche élève :**
- **Informations** : données personnelles
- **Notes** : toutes les évaluations et moyennes
- **Présences** : historique des présences/absences
- **Paiements** : historique des paiements mensuels
- **Bulletins** : accès aux bulletins générés
- **Discipline** : incidents enregistrés

### 3.5 Désactiver / Réactiver un élève

La suppression définitive n'est pas possible directement (protection contre les pertes de données). À la place, on désactive l'élève.

**Désactiver :**
1. Ouvrez la fiche de l'élève
2. Cliquez sur **Désactiver**
3. Confirmez la désactivation
4. L'élève n'apparaît plus dans les listes actives mais ses données sont conservées

**Réactiver :**
1. Activez le filtre **Afficher les inactifs** dans la liste
2. Trouvez l'élève
3. Cliquez sur **Réactiver**

### 3.6 Changer de classe un élève

1. Ouvrez la fiche de l'élève
2. Dans l'onglet **Informations**, cliquez sur le champ **Classe**
3. Sélectionnez la nouvelle classe
4. Cliquez sur **Enregistrer**

> **Note :** L'historique des notes et présences reste associé aux cours de l'ancienne classe. Seuls les futurs cours seront dans la nouvelle classe.

---

## 4. Gestion des classes

### 4.1 Liste des classes

**Accès :** Menu latéral > Classes

La liste affiche toutes les classes avec :
- Nom de la classe
- Nombre d'élèves inscrits
- Professeur principal (si assigné)
- Niveau (si configuré)

### 4.2 Créer une classe

1. Cliquez sur **+ Nouvelle classe**
2. Remplissez :
   - **Nom de la classe** (ex. : "6ème A", "Terminale S2", "BTS1")
   - **Niveau** (facultatif — pour regrouper les classes par niveau)
   - **Professeur principal** (facultatif — sélectionner parmi les profs)
   - **Capacité maximale** (nombre max d'élèves)
3. Cliquez sur **Créer**

### 4.3 Détail d'une classe

Cliquez sur une classe pour accéder à sa page de détail :

- **Liste des élèves** : tous les élèves inscrits dans cette classe
- **Emploi du temps** : grille horaire de la classe
- **Professeurs** : liste des profs enseignant dans cette classe (via les cours)
- **Statistiques** : taux de présence moyen, moyenne générale

### 4.4 Promotion en masse

En fin d'année, la promotion en masse permet de faire passer tous les élèves d'une classe au niveau supérieur.

**Étapes :**

1. Allez dans **Classes**
2. Cliquez sur **Promotion en masse** (bouton en haut à droite)
3. Un assistant s'ouvre avec la liste des classes
4. Pour chaque classe source, sélectionnez la classe de destination
5. Choisissez le comportement pour les élèves redoublants :
   - Les inclure dans la promotion (ils passeront quand même)
   - Les exclure (ils restent dans la classe actuelle)
6. Cliquez sur **Aperçu** pour voir le résultat avant application
7. Cliquez sur **Appliquer la promotion**

> **Attention :** Cette opération est irréversible. Effectuez-la après avoir archivé l'année en cours (voir section Archives).

---

## 5. Gestion des professeurs

### 5.1 Liste des professeurs

**Accès :** Menu latéral > Professeurs

La liste affiche tous les professeurs avec :
- Nom et prénom
- Email
- Matières enseignées
- Nombre de cours dans la semaine
- Statut (actif/inactif)

### 5.2 Ajouter un professeur

1. Cliquez sur **+ Ajouter un professeur**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|------------|-------------|
| Prénom | Oui | |
| Nom | Oui | |
| Email | Oui | Utilisé comme identifiant de connexion |
| Téléphone | Non | |
| Matières | Non | Sélection multiple parmi les matières créées |
| Salaire mensuel | Non | Pour le module comptabilité/RH |
| Date de prise de fonction | Non | |

3. Cliquez sur **Enregistrer**
4. Un email d'invitation est envoyé automatiquement au professeur

### 5.3 Assigner des matières à un professeur

**Méthode 1 — Via la fiche professeur :**
1. Ouvrez la fiche du professeur
2. Section **Matières enseignées**
3. Cliquez sur **+ Ajouter une matière**
4. Sélectionnez la matière dans la liste déroulante
5. Cliquez sur **Enregistrer**

**Méthode 2 — Via la création de cours (emploi du temps) :**
Lors de la création d'un cours, vous associez automatiquement un professeur à une matière.

### 5.4 Fiche professeur

La fiche professeur contient :

| Onglet | Contenu |
|--------|---------|
| Informations | Données personnelles, matières, salaire |
| Cours | Liste des cours assignés (emploi du temps) |
| Présences | Historique des absences du professeur |
| Congés | Demandes de congé (module RH) |
| Documents | Contrats, diplômes (upload) |

---

## 6. Gestion des matières

### 6.1 Vue d'ensemble

**Accès :** Menu latéral > Matières

Les matières sont les disciplines enseignées dans l'établissement. Elles sont utilisées dans l'emploi du temps, les évaluations, les bulletins et les statistiques.

### 6.2 Créer une matière

1. Cliquez sur **+ Nouvelle matière**
2. Remplissez :
   - **Nom de la matière** (ex. : "Mathématiques", "Français", "Physique-Chimie")
   - **Abréviation** (ex. : "MATHS", "FR", "PC") — utilisée dans les emplois du temps
   - **Coefficient** (valeur par défaut pour les bulletins)
   - **Couleur** (pour l'emploi du temps graphique)
3. Cliquez sur **Créer**

### 6.3 Modifier / Supprimer une matière

**Modifier :** Cliquez sur la matière, puis sur le bouton **Modifier**.

**Supprimer :** Possible uniquement si la matière n'est associée à aucun cours. Si des cours utilisent cette matière, vous devez d'abord supprimer ou modifier ces cours.

---

## 7. Emploi du temps

### 7.1 Vue d'ensemble

**Accès :** Menu latéral > Emploi du temps

Le module d'emploi du temps permet de créer et gérer les cours sur une grille horaire hebdomadaire. La détection de conflits est automatique.

### 7.2 Vues disponibles

| Vue | Description |
|-----|-------------|
| Par classe | Affiche le planning d'une classe sélectionnée |
| Par professeur | Affiche le planning d'un professeur sélectionné |
| Par salle | Affiche l'occupation d'une salle |
| Globale | Vue condensée de tous les cours |

### 7.3 Créer un cours

**Méthode 1 — Clic sur la grille**
1. Sélectionnez la vue **Par classe**
2. Choisissez la classe dans le sélecteur
3. Cliquez sur un créneau horaire vide dans la grille
4. Le formulaire de création de cours s'ouvre pré-rempli avec le jour et l'heure
5. Complétez les champs manquants et cliquez sur **Créer**

**Méthode 2 — Bouton + Nouveau cours**
1. Cliquez sur **+ Nouveau cours**
2. Remplissez le formulaire complet :

| Champ | Obligatoire | Description |
|-------|------------|-------------|
| Matière | Oui | Sélection parmi les matières |
| Classe | Oui | Sélection parmi les classes |
| Professeur | Oui | Sélection parmi les profs (filtrés par matière) |
| Salle | Non | Salle de cours |
| Jour de la semaine | Oui | Lundi à Samedi |
| Heure de début | Oui | Format HH:MM |
| Heure de fin | Oui | Format HH:MM |
| Récurrence | Oui | Hebdomadaire (par défaut) ou ponctuel |
| Date de début | Si récurrent | Premier jour du cours |
| Date de fin | Si récurrent | Dernier jour du cours |

3. Cliquez sur **Créer**

### 7.4 Détection de conflits

Le système détecte automatiquement les conflits lors de la création ou modification d'un cours :

| Type de conflit | Description |
|-----------------|-------------|
| Conflit professeur | Le professeur a déjà un cours à ce créneau |
| Conflit salle | La salle est déjà occupée à ce créneau |
| Conflit classe | La classe a déjà un cours à ce créneau |

En cas de conflit, un message d'erreur explicite s'affiche avec le détail du cours en conflit. Vous pouvez choisir de modifier les paramètres ou d'annuler.

### 7.5 Modifier / Supprimer un cours

**Modifier :** Cliquez sur le cours dans la grille, puis sur **Modifier**. Vous pouvez modifier une occurrence ou toutes les occurrences à venir.

**Supprimer :** Cliquez sur le cours, puis sur **Supprimer**. Même choix : une occurrence ou toutes.

### 7.6 Gestion des salles

**Accès :** Paramètres > Salles (ou depuis le formulaire de cours)

Chaque salle peut être configurée avec :
- Nom / numéro de salle
- Capacité (nombre de places)
- Type (salle de classe, laboratoire, salle de sport, etc.)

---

## 8. Présences

### 8.1 Vue d'ensemble

**Accès :** Menu latéral > Présences

Le module de présences permet d'enregistrer les présences/absences élève par cours, de les justifier, et d'accéder aux statistiques d'absentéisme.

### 8.2 Faire l'appel (côté admin/gestionnaire)

1. Allez dans **Présences**
2. Sélectionnez la **classe** et le **cours** (ou la date)
3. La liste des élèves de la classe s'affiche
4. Pour chaque élève, cochez son statut :
   - **Présent** (vert)
   - **Absent** (rouge)
   - **Retard** (orange)
5. Pour les absents, ajoutez optionnellement :
   - **Justification** : oui/non
   - **Motif** : maladie, convenance personnelle, autre
   - **Note** : commentaire libre
6. Cliquez sur **Enregistrer l'appel**

> **Note :** Les professeurs peuvent également faire l'appel depuis leur portail. Un appel déjà enregistré par le prof apparaît ici en lecture seule (l'admin peut quand même le modifier si nécessaire).

### 8.3 Statistiques de présence

**Accès :** Présences > Statistiques

Filtres disponibles :
- Par classe
- Par élève
- Par matière
- Par période (semaine, mois, trimestre, personnalisé)

Données affichées :
- Taux de présence global
- Taux de présence par élève (classé du plus absent au plus présent)
- Taux de présence par matière
- Évolution hebdomadaire

### 8.4 Exports

**Accès :** Présences > Exporter

Formats d'export disponibles :
- **CSV** : pour traitement dans Excel
- **PDF** : rapport formaté avec entête de l'établissement

Contenu exportable :
- Feuille d'appel par cours
- Récapitulatif mensuel par élève
- Rapport d'absentéisme classe

---

## 9. Évaluations et notes

### 9.1 Créer une évaluation

**Accès :** Menu latéral > Évaluations

1. Cliquez sur **+ Nouvelle évaluation**
2. Remplissez :

| Champ | Description |
|-------|-------------|
| Titre | Ex. : "Contrôle chapitre 3 — Fractions" |
| Matière | Matière concernée |
| Classe | Classe évaluée |
| Professeur | Prof qui a créé l'évaluation |
| Type | Contrôle, Devoir maison, Examen, Oral, TP |
| Date | Date de passage de l'évaluation |
| Note maximale | Sur 20 (défaut) ou autre barème |
| Coefficient | Poids dans la moyenne du trimestre |
| Trimestre | 1, 2 ou 3 |

3. Cliquez sur **Créer**

### 9.2 Saisir les notes

1. Cliquez sur l'évaluation créée
2. La liste des élèves de la classe s'affiche
3. Saisissez la note de chaque élève (entre 0 et la note maximale)
4. Marquez **Absent** si l'élève n'était pas présent
5. Ajoutez une **appréciation** (commentaire) si souhaité
6. Cliquez sur **Enregistrer les notes**

Les moyennes sont calculées automatiquement en temps réel (par matière, par trimestre, générale).

### 9.3 Tableau de bord des notes

**Accès :** Évaluations > Notes

Vue synthétique des notes par :
- Classe : tableau des moyennes par matière et par élève
- Matière : distribution des notes, moyenne de la classe
- Élève : profil complet avec toutes les évaluations

### 9.4 Modifier / Supprimer une évaluation

**Modifier les notes :** Cliquez sur l'évaluation, modifiez les notes, cliquez sur **Enregistrer**.

**Supprimer une évaluation :** Cliquez sur l'évaluation > **Supprimer**. Toutes les notes associées sont supprimées. Un log est créé dans le journal d'audit.

---

## 10. Bulletins scolaires

### 10.1 Générer des bulletins

**Accès :** Menu latéral > Bulletins

Les bulletins sont générés à partir des notes saisies dans le module Évaluations.

**Prérequis avant génération :**
- Toutes les évaluations du trimestre doivent être saisies
- Les coefficients des matières doivent être configurés
- Les appréciations des professeurs doivent être renseignées (optionnel)

**Étapes de génération :**

1. Allez dans **Bulletins**
2. Sélectionnez la **classe**
3. Sélectionnez le **trimestre** (1, 2 ou 3)
4. Cliquez sur **Générer les bulletins**
5. Un aperçu s'affiche pour vérification
6. Cliquez sur **Valider et publier**

### 10.2 Contenu d'un bulletin

Chaque bulletin contient :
- Informations de l'élève (nom, prénom, classe)
- Logo et nom de l'établissement
- Trimestre et année scolaire
- Tableau des notes par matière :
  - Note obtenue
  - Moyenne de la classe
  - Appréciation du professeur
- Moyenne générale
- Rang dans la classe
- Appréciation du conseil de classe
- Décision (passage, redoublement, félicitations, encouragements)
- Signature du directeur

### 10.3 Export PDF

1. Sélectionnez le(s) bulletin(s) à exporter
2. Cliquez sur **Exporter en PDF**
3. Options d'export :
   - **Bulletin individuel** : un PDF par élève
   - **Classe complète** : un PDF avec tous les bulletins (un par page)
4. Le PDF est généré et téléchargé

### 10.4 Versionning des bulletins

Chaque bulletin publié est versionné. Si vous devez effectuer une correction après publication :
1. Modifiez les notes concernées
2. Regénérez le bulletin
3. Une nouvelle version (v2, v3...) est créée
4. L'historique des versions est conservé
5. La version active est celle affichée aux élèves et parents

---

## 11. Paiements

### 11.1 Vue d'ensemble

**Accès :** Menu latéral > Paiements

Le module de paiements gère les frais de scolarité mensuels des élèves. Il permet d'enregistrer les paiements, de gérer les paiements partiels, et d'émettre des reçus.

### 11.2 Configurer les frais de scolarité

**Accès :** Paiements > Configuration

1. Définissez le montant mensuel par classe (ou un montant unique pour tous)
2. Définissez les mois de facturation (septembre à juin par défaut)
3. Définissez les modes de paiement acceptés :
   - Espèces
   - Chèque
   - Virement bancaire
   - Mobile Money (si applicable)
4. Cliquez sur **Enregistrer**

### 11.3 Enregistrer un paiement

1. Allez dans **Paiements**
2. Cliquez sur **+ Enregistrer un paiement**
3. Remplissez :

| Champ | Description |
|-------|-------------|
| Élève | Recherche par nom |
| Mois | Mois concerné par le paiement |
| Montant attendu | Pré-rempli selon la configuration |
| Montant reçu | Montant réellement payé (peut être partiel) |
| Mode de paiement | Espèces, chèque, virement... |
| Référence | Numéro de chèque, référence virement (optionnel) |
| Date | Date du paiement |
| Remarque | Note libre |

4. Cliquez sur **Enregistrer**

**Paiement partiel :** Si le montant reçu est inférieur au montant attendu, le paiement est marqué comme "partiel". Le solde restant est visible sur la fiche de l'élève.

### 11.4 Tableau de bord des paiements

**Vue mensuelle :** Pour un mois donné, liste de tous les élèves avec leur statut de paiement :
- Payé (vert) — montant complet reçu
- Partiel (orange) — paiement partiel reçu
- Non payé (rouge) — aucun paiement pour ce mois
- Exonéré (gris) — élève exonéré de frais

**Statistiques :**
- Montant total attendu
- Montant total reçu
- Taux de recouvrement (%)
- Liste des impayés

### 11.5 Générer un reçu de paiement

1. Cliquez sur un paiement enregistré
2. Cliquez sur **Générer le reçu**
3. Un PDF est généré avec :
   - Nom et logo de l'établissement
   - Identité de l'élève
   - Montant payé, mode de paiement, date
   - Numéro de reçu unique
   - Mention "REÇU POUR SOLDE DE TOUT COMPTE" si paiement complet
4. Imprimez ou envoyez par email au parent

### 11.6 Export des données de paiement

**Accès :** Paiements > Exporter

- Export CSV : toutes les transactions d'une période
- Export PDF : rapport mensuel formaté
- Export comptable : format compatible avec les logiciels comptables courants

---

## 12. Comptabilité

### 12.1 Vue d'ensemble

**Accès :** Menu latéral > Comptabilité

Le module comptabilité permet de suivre l'ensemble des flux financiers de l'établissement : recettes (paiements élèves), dépenses et salaires.

### 12.2 Dépenses

**Enregistrer une dépense :**

1. Allez dans **Comptabilité > Dépenses**
2. Cliquez sur **+ Nouvelle dépense**
3. Remplissez :

| Champ | Description |
|-------|-------------|
| Intitulé | Description de la dépense |
| Montant | En euros |
| Catégorie | Fournitures, Maintenance, Loyer, Services, Autre |
| Date | Date de la dépense |
| Justificatif | Upload d'un fichier (PDF, JPG) |
| Remarque | Note libre |

4. Cliquez sur **Enregistrer**

### 12.3 Salaires

**Enregistrer le paiement d'un salaire :**

1. Allez dans **Comptabilité > Salaires**
2. Sélectionnez le mois
3. La liste des professeurs avec leur salaire mensuel s'affiche
4. Pour chaque professeur, marquez le salaire comme **Payé** avec la date de paiement
5. Possibilité d'ajuster le montant (primes, déductions)

**Récapitulatif de la masse salariale :** Vue mensuelle du total des salaires, avec comparaison aux mois précédents.

### 12.4 Tableau financier global

**Accès :** Comptabilité > Tableau de bord financier

Vue mensuelle et annuelle avec :
- Recettes (paiements élèves)
- Dépenses (charges)
- Salaires
- Solde = Recettes - Dépenses - Salaires
- Graphique d'évolution sur 12 mois

---

## 13. Messagerie interne

### 13.1 Vue d'ensemble

**Accès :** Menu latéral > Messages

La messagerie interne permet la communication entre tous les utilisateurs de la plateforme (admin, gestionnaire, profs, élèves, parents) sans sortir de l'application.

### 13.2 Envoyer un message

1. Cliquez sur **+ Nouveau message**
2. Remplissez :
   - **À** : un ou plusieurs destinataires (recherche par nom)
   - **Objet** : sujet du message
   - **Corps** : texte du message (éditeur riche disponible)
   - **Pièces jointes** : upload de fichiers (optionnel)
3. Cliquez sur **Envoyer**

**Groupes de destinataires prédéfinis :**
- Tous les professeurs
- Tous les parents d'une classe
- Tous les élèves d'une classe
- Tout l'établissement

### 13.3 Gestion des messages reçus

- **Boîte de réception** : messages reçus (non lus en gras)
- **Envoyés** : copies des messages envoyés
- **Archivés** : messages archivés manuellement
- **Corbeille** : messages supprimés (conservés 30 jours)

---

## 14. Notifications

### 14.1 Vue d'ensemble

**Accès :** Paramètres > Notifications

Le module de notifications permet de configurer les alertes envoyées automatiquement aux utilisateurs via push (navigateur) et email.

### 14.2 Types de notifications configurables

| Événement | Destinataires | Canal |
|-----------|--------------|-------|
| Nouvelle absence | Parent de l'élève concerné | Push + Email |
| Note ajoutée | Élève + Parent | Push |
| Bulletin disponible | Élève + Parent | Push + Email |
| Paiement en retard | Parent + Admin | Email |
| Nouveau message | Destinataire | Push |
| Devoir rendu (LMS) | Prof | Push |
| Nouveau bulletin | Élève | Push + Email |

### 14.3 Activer les notifications push

Pour activer les notifications push (navigateur) :
1. Allez dans **Paramètres > Notifications**
2. Cliquez sur **Activer les notifications push**
3. Autorisez les notifications dans la fenêtre de confirmation du navigateur
4. Configurez quelles événements déclenchent une notification push

> **Note :** Les notifications push nécessitent que l'utilisateur soit connecté depuis un navigateur compatible (Chrome, Firefox, Edge) et que le navigateur soit ouvert.

---

## 15. Cahier de texte

### 15.1 Vue d'ensemble

**Accès :** Menu latéral > Cahier de texte

Le cahier de texte numérique permet aux professeurs de noter le contenu de chaque cours et les devoirs à faire. Il est consultable par les élèves, les parents et l'administration.

### 15.2 Consulter le cahier de texte (côté admin)

1. Allez dans **Cahier de texte**
2. Filtrez par classe et/ou par matière
3. Sélectionnez la période à consulter
4. Les entrées s'affichent chronologiquement avec :
   - Date du cours
   - Matière et professeur
   - Contenu du cours (leçon)
   - Travail à faire (devoirs)
   - Fichiers joints (si des ressources ont été partagées)

### 15.3 Créer une entrée (côté admin / en remplacement d'un prof)

1. Cliquez sur **+ Nouvelle entrée**
2. Sélectionnez la classe, la matière, le cours et la date
3. Rédigez le contenu du cours
4. Rédigez le travail à faire (devoirs)
5. Joignez des fichiers si nécessaire
6. Cliquez sur **Enregistrer**

---

## 16. Discipline

### 16.1 Vue d'ensemble

**Accès :** Menu latéral > Discipline

Le module discipline permet d'enregistrer les incidents, sanctions et mesures disciplinaires concernant les élèves.

### 16.2 Enregistrer un incident

1. Cliquez sur **+ Nouvel incident**
2. Remplissez :

| Champ | Description |
|-------|-------------|
| Élève | Élève concerné |
| Date | Date de l'incident |
| Type | Retard, Insolence, Absence injustifiée, Violence, Triche, Autre |
| Description | Détails de l'incident |
| Signalé par | Professeur ou gestionnaire auteur du signalement |
| Mesure | Avertissement, Retenue, Exclusion temporaire, Convocation parent |
| Suivi | Statut du traitement (en cours, résolu) |

3. Cliquez sur **Enregistrer**

### 16.3 Historique disciplinaire

Chaque élève dispose d'un historique disciplinaire visible dans sa fiche (onglet **Discipline**). L'historique affiche tous les incidents enregistrés, chronologiquement.

---

## 17. Admissions

### 17.1 Vue d'ensemble

**Accès :** Menu latéral > Admissions

Le module admissions gère les candidatures de nouveaux élèves, de la demande initiale jusqu'à l'inscription définitive.

### 17.2 Formulaire d'admission public

Chaque établissement dispose d'un formulaire d'admission public accessible sans connexion via une URL unique :
`https://edutrack.app/admissions/{school-id}`

Ce formulaire collecte :
- Informations de l'élève (prénom, nom, date de naissance)
- Classe souhaitée
- Informations des parents (noms, emails, téléphones)
- Documents demandés (bulletins précédents, certificat de scolarité, photo)
- Message libre du candidat

### 17.3 Pipeline de gestion des candidatures

Les candidatures reçues apparaissent dans le pipeline (vue Kanban) avec les étapes :

1. **Nouveau** — Candidature reçue, non traitée
2. **En cours d'examen** — Dossier en cours de révision
3. **Entretien planifié** — Rendez-vous d'entretien fixé
4. **Accepté** — Candidature retenue
5. **Refusé** — Candidature non retenue
6. **Inscrit** — Élève officiellement inscrit (converti en élève dans le système)

**Déplacer une candidature :** Glissez-déposez la carte ou cliquez sur la candidature et changez son statut.

**Convertir en élève :** Depuis une candidature acceptée, cliquez sur **Inscrire l'élève**. Les données du formulaire sont pré-remplies dans la fiche élève.

---

## 18. Transport

### 18.1 Vue d'ensemble

**Accès :** Menu latéral > Transport

Le module transport gère les lignes de bus scolaires et l'affectation des élèves aux différentes routes.

### 18.2 Gérer les routes de transport

**Créer une route :**
1. Allez dans **Transport > Routes**
2. Cliquez sur **+ Nouvelle route**
3. Remplissez : nom de la route, points d'arrêt, véhicule, conducteur, horaires
4. Cliquez sur **Créer**

**Affecter un élève à une route :**
1. Allez dans **Transport > Affectations**
2. Recherchez l'élève
3. Sélectionnez la route et le point d'arrêt
4. Cliquez sur **Assigner**

---

## 19. Bibliothèque

### 19.1 Vue d'ensemble

**Accès :** Menu latéral > Bibliothèque

Le module bibliothèque permet de gérer le catalogue de livres de l'établissement et les emprunts des élèves.

### 19.2 Gérer le catalogue

**Ajouter un livre :**
1. Allez dans **Bibliothèque > Catalogue**
2. Cliquez sur **+ Nouveau livre**
3. Renseignez : titre, auteur, ISBN, éditeur, année, catégorie, nombre d'exemplaires
4. Cliquez sur **Ajouter**

### 19.3 Gérer les emprunts

**Enregistrer un emprunt :**
1. Allez dans **Bibliothèque > Emprunts**
2. Cliquez sur **+ Nouvel emprunt**
3. Sélectionnez l'élève et le livre
4. Renseignez la date de retour prévue
5. Cliquez sur **Enregistrer**

**Retour d'un livre :**
1. Trouvez l'emprunt actif dans la liste
2. Cliquez sur **Retour effectué**
3. Notez l'état du livre si nécessaire

---

## 20. Ressources Humaines

### 20.1 Vue d'ensemble

**Accès :** Menu latéral > RH

Le module RH gère les demandes de congé du personnel enseignant et administratif.

### 20.2 Gérer les congés

**Consulter les demandes de congé :**
1. Allez dans **RH > Congés**
2. Filtrez par statut : En attente / Approuvé / Refusé
3. Cliquez sur une demande pour voir les détails

**Approuver ou refuser une demande :**
1. Ouvrez la demande
2. Vérifiez les dates et le motif
3. Cliquez sur **Approuver** ou **Refuser**
4. Ajoutez un commentaire si nécessaire
5. Le professeur reçoit une notification

**Calendrier des congés :** Vue calendrier de tous les congés approuvés par mois.

---

## 21. LMS — Apprentissage en ligne

### 21.1 Vue d'ensemble

**Accès :** Menu latéral > LMS

Le LMS (Learning Management System) permet aux professeurs de créer des devoirs en ligne, que les élèves peuvent remettre directement sur la plateforme.

### 21.2 Fonctionnement

**Workflow côté prof :**
1. Créer un devoir (titre, consigne, date limite, classe, matière)
2. Attacher des ressources (PDF, vidéo, liens)
3. Choisir le mode de rendu (fichier, texte en ligne, lien URL)

**Workflow côté élève :**
1. Voir le devoir dans le portail élève
2. Télécharger les ressources
3. Remettre le devoir avant la date limite

**Workflow côté admin (supervision) :**
1. Accédez à **LMS > Devoirs**
2. Visualisez tous les devoirs en cours
3. Consultez les statistiques de remise (% d'élèves ayant rendu le devoir)
4. Accédez aux notes attribuées par le prof

---

## 22. Analytics avancées

### 22.1 Vue d'ensemble

**Accès :** Menu latéral > Analytics

Le module analytics fournit des tableaux de bord approfondis pour analyser les performances de l'établissement sur tous les axes.

### 22.2 Rapports disponibles

| Rapport | Contenu |
|---------|---------|
| Performance académique | Évolution des moyennes par classe, par matière, par période |
| Absentéisme | Taux d'absence par classe, jour de la semaine, matière |
| Financier | Recettes, dépenses, taux de recouvrement sur 12 mois |
| Comparatif | Comparaison entre classes, entre trimestres |
| Alertes | Élèves en difficulté détectés automatiquement |

### 22.3 Exporter les rapports

Chaque rapport peut être exporté en :
- PDF (formaté avec logo de l'établissement)
- CSV (données brutes pour analyse externe)
- Excel (tableaux croisés dynamiques prêts à l'emploi)

---

## 23. Journal d'audit

### 23.1 Vue d'ensemble

**Accès :** Menu latéral > Journal d'audit

Le journal d'audit enregistre toutes les actions effectuées par tous les utilisateurs de l'établissement. Il est en lecture seule et ne peut pas être modifié.

### 23.2 Informations enregistrées

Chaque entrée du journal contient :
- Date et heure de l'action (timestamp précis)
- Utilisateur auteur de l'action
- Type d'action (création, modification, suppression, connexion, export...)
- Module concerné (élèves, paiements, notes...)
- Détail de l'action (ex. : "Note modifiée de 12 à 14 pour Marie Dupont - Évaluation n°42")
- Adresse IP (pour les actions sensibles)

### 23.3 Filtres et recherche

Filtrez le journal par :
- Utilisateur
- Type d'action
- Module
- Période (calendrier)
- Recherche textuelle

### 23.4 Utilisation

Le journal d'audit est particulièrement utile pour :
- Vérifier qui a modifié une note contestée
- Contrôler qui a accédé à des données sensibles
- Prouver la traçabilité en cas de litige
- Détecter des comportements anormaux

---

## 24. Archives et corbeille

### 24.1 Archives de fin d'année

**Accès :** Menu latéral > Archives

En fin d'année scolaire, l'archivage permet de clôturer l'année en cours et de préparer la nouvelle année.

**Processus d'archivage :**

1. Allez dans **Archives**
2. Cliquez sur **Archiver l'année en cours**
3. Vérifiez la checklist présentée :
   - [ ] Tous les bulletins ont été générés
   - [ ] Tous les paiements ont été saisis
   - [ ] L'emploi du temps est complet
   - [ ] Les absences ont été justifiées
4. Confirmez en tapant l'année scolaire (ex. : "2024-2025")
5. L'archivage est effectué (peut prendre quelques minutes)

**Résultat de l'archivage :**
- Toutes les données de l'année sont figées et consultables dans les archives
- L'année scolaire courante est réinitialisée
- Les classes et élèves restent actifs pour la nouvelle année (promotion à faire manuellement)

**Consulter les archives :**
1. Allez dans **Archives**
2. Sélectionnez l'année archivée dans le menu déroulant
3. Naviguez dans les données historiques (lecture seule)

### 24.2 Corbeille

**Accès :** Menu latéral > Corbeille

Les éléments supprimés (élèves désactivés, cours supprimés, documents effacés) sont conservés dans la corbeille pendant 90 jours avant suppression définitive.

**Restaurer un élément :**
1. Allez dans **Corbeille**
2. Trouvez l'élément à restaurer (filtrez par type)
3. Cliquez sur **Restaurer**
4. L'élément est remis dans son état d'origine

**Vider la corbeille :** Cliquez sur **Vider la corbeille** pour supprimer définitivement tous les éléments. Cette action est irréversible.

---

## 25. Gestion des utilisateurs

### 25.1 Vue d'ensemble

**Accès :** Paramètres > Utilisateurs

Cette section permet de créer, gérer et désactiver tous les comptes utilisateurs de l'établissement.

### 25.2 Créer un utilisateur

1. Cliquez sur **+ Nouvel utilisateur**
2. Remplissez :

| Champ | Description |
|-------|-------------|
| Email | Adresse email (identifiant de connexion) |
| Prénom et Nom | Identité |
| Rôle | gestionnaire, prof, eleve, parent |
| Permissions spécifiques | Ajustements fins des droits (voir ci-dessous) |

3. Cliquez sur **Créer**
4. Un email d'invitation est envoyé automatiquement

### 25.3 Gestion des permissions

Chaque rôle a des permissions par défaut. L'admin peut ajuster les permissions individuellement :

| Permission | Gestionnaire | Prof | Élève | Parent |
|-----------|:---:|:---:|:---:|:---:|
| Voir les élèves | Oui | Ses classes | Non | Son enfant |
| Modifier les élèves | Oui | Non | Non | Non |
| Voir les notes | Oui | Ses classes | Ses notes | Notes enfant |
| Modifier les notes | Oui | Ses cours | Non | Non |
| Voir les paiements | Oui | Non | Non | Ses paiements |
| Modifier les paiements | Oui | Non | Non | Non |
| Accès comptabilité | Non | Non | Non | Non |
| Journal d'audit | Non | Non | Non | Non |

### 25.4 Désactiver un utilisateur

1. Trouvez l'utilisateur dans la liste
2. Cliquez sur **Désactiver**
3. L'utilisateur ne peut plus se connecter
4. Ses données sont conservées

---

## 26. Paramètres de l'établissement

### 26.1 Informations générales

**Accès :** Paramètres > Établissement

- **Nom de l'établissement** : affiché dans les en-têtes, bulletins, reçus
- **Logo** : upload JPG/PNG (min. 200x200px, max. 2 Mo)
- **Couleur principale** : couleur de l'interface et des documents exportés
- **Couleur secondaire** : couleur complémentaire
- **Adresse** : adresse physique de l'établissement
- **Téléphone** et **Email** : coordonnées officielles
- **Site web** : URL du site de l'établissement (affiché sur les documents)

### 26.2 Paramètres de l'année scolaire

- **Année scolaire courante** (ex. : "2025-2026")
- **Date de début** et **Date de fin** de l'année
- **Trimestres** : dates de début et fin de chaque trimestre
- **Vacances scolaires** : périodes de vacances (optionnel — pour l'emploi du temps)

### 26.3 Thème de l'interface

Les changements de couleur s'appliquent en temps réel à l'interface de tous les utilisateurs de l'établissement (mode clair et mode sombre respectent les couleurs choisies).

---

## 27. Abonnement et facturation

### 27.1 Consulter votre abonnement

**Accès :** Paramètres > Abonnement

Cette section affiche :
- Votre plan actuel
- Date de renouvellement
- Nombre d'élèves actifs vs limite du plan
- Historique des factures

### 27.2 Changer de plan

1. Allez dans **Paramètres > Abonnement**
2. Cliquez sur **Changer de plan**
3. Sélectionnez le nouveau plan
4. Confirmez le paiement via Stripe (redirection sécurisée)
5. Le nouveau plan est actif immédiatement

Pour plus de détails sur les plans, voir le document [Abonnements SaaS](./saas-abonnements.md).

---

*Guide Administrateur EduTrack — Version 1.0 — Février 2026*
