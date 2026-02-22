# Guide Utilisateurs EduTrack

> Ce guide s'adresse à tous les utilisateurs finaux de la plateforme EduTrack selon leur rôle : **gestionnaire** (secrétaire), **professeur**, **élève** et **parent**. Chaque section décrit les fonctionnalités accessibles, étape par étape.

---

## Table des matières

1. [Se connecter à EduTrack](#1-se-connecter-à-edutrack)
2. [Navigation et interface générale](#2-navigation-et-interface-générale)
3. [Portail Gestionnaire](#3-portail-gestionnaire)
4. [Portail Professeur](#4-portail-professeur)
5. [Portail Élève](#5-portail-élève)
6. [Portail Parent](#6-portail-parent)
7. [Fonctionnalités communes](#7-fonctionnalités-communes)
8. [Résolution des problèmes courants](#8-résolution-des-problèmes-courants)

---

## 1. Se connecter à EduTrack

### 1.1 Première connexion

Lors de votre premier accès à EduTrack, vous recevrez un **email d'invitation** envoyé par votre établissement. Cet email contient :
- Un lien de création de mot de passe
- L'URL d'accès à votre portail

**Étapes :**
1. Cliquez sur le lien dans l'email d'invitation
2. Le lien vous dirige vers une page de définition de mot de passe
3. Choisissez un mot de passe (min. 8 caractères — majuscule + chiffre recommandés)
4. Confirmez le mot de passe
5. Cliquez sur **Définir mon mot de passe**
6. Vous êtes automatiquement connecté et redirigé vers votre tableau de bord

> **Important :** Le lien d'invitation est valable 24 heures. Si le délai est dépassé, contactez votre secrétariat pour qu'il vous renvoie une invitation.

### 1.2 Connexions suivantes

1. Accédez à l'URL de votre établissement (ex. : `https://edutrack.app/login`)
2. Saisissez votre **adresse email** (celle sur laquelle vous avez reçu l'invitation)
3. Saisissez votre **mot de passe**
4. Cliquez sur **Se connecter**

### 1.3 Mot de passe oublié

1. Sur la page de connexion, cliquez sur **Mot de passe oublié ?**
2. Entrez votre adresse email
3. Cliquez sur **Envoyer le lien de réinitialisation**
4. Vérifiez votre boîte email (vérifiez aussi les spams)
5. Cliquez sur le lien reçu et définissez un nouveau mot de passe

### 1.4 Se déconnecter

Cliquez sur votre avatar ou vos initiales en haut à droite, puis sur **Se déconnecter**.

> **Conseil sécurité :** Déconnectez-vous toujours si vous utilisez un ordinateur partagé.

---

## 2. Navigation et interface générale

### 2.1 Structure de l'interface

L'interface EduTrack est structurée en trois zones :

```
+------------------+------------------------------------------+
|                  |                                          |
|   Menu latéral   |          Zone de contenu principale      |
|   (navigation)   |                                          |
|                  |                                          |
+------------------+------------------------------------------+
|              Barre de navigation supérieure                  |
+--------------------------------------------------------------+
```

**Barre supérieure :**
- Logo et nom de votre établissement (gauche)
- Icône de notifications — cloche avec compteur de non-lus (droite)
- Icône de messagerie — enveloppe avec compteur (droite)
- Avatar / initiales — menu compte (droite)
- Bouton de basculement thème clair/sombre (droite)

**Menu latéral :**
- Les entrées du menu varient selon votre rôle
- Un indicateur visuel (fond coloré) indique la section active
- Le menu peut être réduit pour agrandir la zone de contenu (clic sur le bouton réduire)

### 2.2 Mode clair et mode sombre

EduTrack supporte deux thèmes visuels :
- **Mode clair** : fond blanc, texte sombre
- **Mode sombre** : fond sombre, texte clair — recommandé en soirée

Pour basculer : cliquez sur l'icône lune/soleil dans la barre supérieure. Votre préférence est sauvegardée automatiquement.

### 2.3 Notifications

Le système de notifications vous avertit en temps réel des événements vous concernant.

**Voir vos notifications :**
1. Cliquez sur l'icône de cloche en haut à droite
2. La liste de vos notifications récentes s'affiche
3. Les notifications non lues apparaissent en surbrillance
4. Cliquez sur une notification pour accéder au contenu correspondant

**Types de notifications selon votre rôle :**

| Rôle | Notifications reçues |
|------|---------------------|
| Gestionnaire | Nouveaux paiements, candidatures admissions, messages |
| Professeur | Nouveaux messages, devoirs rendus, rappels d'appel |
| Élève | Nouvelle note, nouveau devoir, bulletin disponible, message |
| Parent | Absence de l'enfant, nouvelle note, paiement rappel, bulletin |

---

## 3. Portail Gestionnaire

Le gestionnaire (secrétaire, assistant administratif) dispose d'un accès étendu à presque toutes les fonctionnalités administratives, à l'exception de certaines actions réservées à l'administrateur (directeur).

### 3.1 Différences avec le rôle Admin

| Fonctionnalité | Admin | Gestionnaire |
|---------------|:-----:|:------------:|
| Tableau de bord complet | Oui | Oui |
| Gestion élèves (CRUD) | Oui | Oui |
| Gestion professeurs | Oui | Lecture seule |
| Paiements | Oui | Oui |
| Comptabilité complète | Oui | Limitée |
| Paramètres établissement | Oui | Non |
| Abonnement/facturation | Oui | Non |
| Gestion utilisateurs | Oui | Non |
| Journal d'audit | Oui | Non |
| Archives | Oui | Non |

### 3.2 Tableau de bord gestionnaire

Le tableau de bord du gestionnaire affiche les mêmes KPIs que celui de l'admin, mais avec un accent sur les tâches opérationnelles quotidiennes :

- **File d'attente admissions** : nombre de candidatures en attente de traitement
- **Paiements du jour** : paiements enregistrés aujourd'hui
- **Absences non justifiées** : élèves avec des absences non encore traitées
- **Messages non lus** : messages en attente de réponse

### 3.3 Gestion des élèves (quotidien)

Les tâches quotidiennes du gestionnaire liées aux élèves :

**Enregistrer un paiement :**
1. Allez dans **Paiements**
2. Cliquez sur **+ Enregistrer un paiement**
3. Recherchez l'élève par nom
4. Sélectionnez le mois concerné
5. Saisissez le montant reçu, le mode de paiement et la date
6. Cliquez sur **Enregistrer**
7. Cliquez sur **Générer le reçu** pour imprimer ou envoyer au parent

**Justifier une absence :**
1. Allez dans **Présences**
2. Filtrez par classe ou par élève
3. Trouvez l'absence à justifier
4. Cliquez sur **Justifier**
5. Sélectionnez le motif et éventuellement uploadez un justificatif (certificat médical)
6. Cliquez sur **Enregistrer**

**Mettre à jour la fiche d'un élève :**
1. Allez dans **Élèves**
2. Recherchez l'élève
3. Cliquez sur sa fiche
4. Cliquez sur **Modifier**
5. Mettez à jour les informations nécessaires
6. Cliquez sur **Enregistrer**

### 3.4 Traitement des candidatures d'admission

1. Allez dans **Admissions**
2. La vue Kanban affiche les candidatures par étape
3. Cliquez sur une candidature pour voir le dossier complet
4. Faites passer la candidature à l'étape suivante en la déplaçant dans le Kanban
5. Pour inscrire un élève accepté :
   a. Ouvrez la candidature
   b. Cliquez sur **Inscrire comme élève**
   c. Vérifiez les données pré-remplies
   d. Sélectionnez la classe
   e. Cliquez sur **Confirmer l'inscription**

### 3.5 Génération de documents

**Attestation de scolarité :**
1. Ouvrez la fiche de l'élève
2. Cliquez sur **Générer un document**
3. Sélectionnez **Attestation de scolarité**
4. Le PDF est généré et téléchargé

**Reçu de paiement :**
1. Allez dans **Paiements**
2. Trouvez le paiement
3. Cliquez sur **Reçu PDF**

---

## 4. Portail Professeur

### 4.1 Vue d'ensemble

Le portail professeur est conçu pour les tâches pédagogiques quotidiennes. Les professeurs accèdent à leurs classes, font l'appel, saisissent les notes, tiennent le cahier de texte et communiquent avec l'établissement.

### 4.2 Tableau de bord professeur

Le tableau de bord affiche :

- **Mon planning du jour** : cours du jour avec horaires et classes
- **Appels en attente** : cours passés pour lesquels l'appel n'a pas encore été fait
- **Devoirs à corriger** (LMS) : soumissions d'élèves en attente de notation
- **Messages non lus** : derniers messages reçus
- **Mes classes** : accès rapide aux classes que j'enseigne

### 4.3 Faire l'appel

L'appel (enregistrement des présences) est l'une des tâches les plus fréquentes du professeur.

**Étapes :**

1. Allez dans **Présences** ou cliquez sur **Faire l'appel** depuis le tableau de bord
2. Si plusieurs cours sont disponibles, sélectionnez le bon cours (classe + matière + date)
3. La liste des élèves inscrits dans la classe s'affiche
4. Pour chaque élève, indiquez son statut :
   - Cliquez une fois sur le nom : **Présent** (vert)
   - Cliquez deux fois : **Absent** (rouge)
   - Cliquez trois fois : **Retard** (orange)
   - Ou utilisez les boutons radio à droite du nom
5. Pour les absents, vous pouvez ajouter une note (ex. : "a prévenu par SMS")
6. Cliquez sur **Valider l'appel**

> **Conseil :** Faites l'appel dans les 10 premières minutes du cours. Passé ce délai, l'administration peut le faire à votre place.

**Modifier un appel déjà fait :**
1. Allez dans **Présences > Historique**
2. Trouvez le cours concerné
3. Cliquez sur **Modifier l'appel**
4. Mettez à jour les statuts
5. Cliquez sur **Enregistrer les modifications**

### 4.4 Mes élèves

**Accès :** Menu latéral > Mes élèves

Vue de tous les élèves de vos classes avec :
- Statut de présence général (taux)
- Moyenne dans votre matière
- Indicateur d'alerte (élèves en difficulté ou très absents)

**Fiche élève (vue prof) :**
Cliquez sur un élève pour voir :
- Ses notes dans votre matière (toutes les évaluations)
- Son historique de présence dans vos cours
- Ses coordonnées (email, téléphone — si l'admin a autorisé l'accès)

### 4.5 Cahier de texte

**Accès :** Menu latéral > Cahier de texte

Le cahier de texte vous permet de noter, pour chaque cours, ce qui a été fait et les devoirs à faire. Il est lisible par les élèves, les parents et l'administration.

**Ajouter une entrée :**

1. Allez dans **Cahier de texte**
2. Cliquez sur **+ Nouvelle entrée**
3. Sélectionnez la classe et la date du cours (votre emploi du temps s'affiche en aide)
4. Remplissez les champs :

| Champ | Description |
|-------|-------------|
| Contenu du cours | Ce qui a été enseigné — peut inclure des titres de chapitres |
| Travail à faire | Devoirs, exercices, lectures à faire pour la prochaine fois |
| Ressources | Fichiers PDF, liens, images (optionnel) |
| Commentaire interne | Note interne visible uniquement par l'administration (non visible élèves/parents) |

5. Cliquez sur **Enregistrer**

**Consulter le cahier :**
- Filtrez par classe ou par matière
- Naviguez par semaine avec les flèches gauche/droite
- Chaque entrée affiche : date, contenu, devoirs

### 4.6 Évaluations et saisie des notes

**Créer une évaluation :**

1. Allez dans **Évaluations**
2. Cliquez sur **+ Nouvelle évaluation**
3. Remplissez :
   - **Titre** : nom de l'évaluation
   - **Classe** : sélectionnez votre classe
   - **Matière** : votre matière est pré-sélectionnée
   - **Type** : Contrôle, DM, Examen, Oral, TP, Interrogation orale
   - **Date** : date de passage
   - **Sur** : barème (20 par défaut)
   - **Coefficient** : poids dans la moyenne
   - **Trimestre** : 1er, 2ème ou 3ème

4. Cliquez sur **Créer**

**Saisir les notes :**

1. Ouvrez l'évaluation créée
2. La liste des élèves de la classe s'affiche, avec un champ de saisie par élève
3. Saisissez la note de chaque élève (entre 0 et le barème)
4. Marquez **Absent** ou **Non rendu** le cas échéant
5. Ajoutez une **appréciation** individuelle si souhaité (commentaire visible sur le bulletin)
6. La moyenne de la classe se calcule en temps réel en bas de la liste
7. Cliquez sur **Enregistrer les notes**

> **Bon à savoir :** Les notes sont visibles immédiatement par les élèves et parents dans leurs portails, sauf si l'admin a configuré une publication différée.

**Modifier des notes :**
1. Ouvrez l'évaluation
2. Cliquez sur **Modifier les notes**
3. Effectuez vos corrections
4. Cliquez sur **Enregistrer**

> **Attention :** Toute modification de note est tracée dans le journal d'audit.

### 4.7 Messagerie

**Accès :** Menu latéral > Messages

La messagerie vous permet de communiquer avec :
- L'administration (admin, gestionnaire)
- D'autres professeurs
- Les élèves de vos classes
- Les parents des élèves de vos classes

**Envoyer un message :**
1. Cliquez sur **+ Nouveau message**
2. Dans le champ **À**, tapez le nom ou sélectionnez un groupe :
   - "Parents de [Classe]" pour écrire à tous les parents d'une classe
   - "Élèves de [Classe]" pour écrire à tous les élèves d'une classe
3. Rédigez votre message
4. Ajoutez des pièces jointes si nécessaire
5. Cliquez sur **Envoyer**

### 4.8 Demande de congé

**Accès :** Mon profil > Congés ou Menu > RH > Mes congés

1. Cliquez sur **+ Nouvelle demande de congé**
2. Remplissez :
   - Date de début et date de fin
   - Type de congé : maladie, personnel, formation, autre
   - Motif (détails)
   - Documents justificatifs (upload optionnel)
3. Cliquez sur **Soumettre la demande**
4. L'administration reçoit une notification
5. Vous recevrez une notification lorsque votre demande sera traitée

---

## 5. Portail Élève

### 5.1 Vue d'ensemble

Le portail élève est un espace de consultation permettant à l'élève de suivre sa scolarité en temps réel. Il est en **lecture seule** : l'élève ne peut pas modifier de données, seulement les consulter.

### 5.2 Tableau de bord élève

Le tableau de bord affiche un résumé de la situation scolaire :

- **Moyenne générale du trimestre** en cours
- **Prochains cours** : les cours de la journée / demain
- **Devoirs à rendre** : travaux avec date limite proche (LMS)
- **Dernières notes** : les 5 dernières évaluations
- **Alertes** : absences non justifiées, notes faibles (si configuré par l'admin)

### 5.3 Mes notes

**Accès :** Menu > Mes notes

**Vue par matière :**
- Liste de toutes les matières avec votre moyenne dans chacune
- Cliquez sur une matière pour voir le détail : toutes les évaluations, les notes, les appréciations du professeur

**Vue par évaluation :**
- Liste chronologique de toutes vos évaluations
- Nom de l'évaluation, matière, note obtenue / note maximale, date, coefficient, appréciation

**Comprendre les indicateurs :**

| Indicateur | Signification |
|-----------|---------------|
| Flèche verte vers le haut | Votre note est au-dessus de la moyenne de la classe |
| Flèche rouge vers le bas | Votre note est en dessous de la moyenne de la classe |
| "=" neutre | Votre note est dans la moyenne de la classe |

**Exemple de vue :**
```
Mathématiques — Moyenne : 14.5/20
─────────────────────────────────────────────────
Contrôle Ch.3 - Fractions     | 15/20 | Coeff. 2 | 12 oct.
Devoir maison n°2              | 18/20 | Coeff. 1 | 05 oct.
Interrogation orale            | 11/20 | Coeff. 1 | 28 sept.
─────────────────────────────────────────────────
Appréciation : "Bon travail, continuez ainsi."
```

### 5.4 Mes présences

**Accès :** Menu > Mes présences

Vue de toutes vos présences et absences :

**Résumé :**
- Nombre total de cours
- Nombre de présences
- Nombre d'absences (dont justifiées)
- Nombre de retards
- Taux de présence global (%)

**Détail par cours :**
Tableau chronologique avec pour chaque cours :
- Date
- Matière et professeur
- Statut : Présent / Absent / Retard
- Justifié : Oui / Non / En attente
- Motif de justification (si renseigné)

> **Que faire en cas d'absence injustifiée ?** Si vous estimez qu'une absence est incorrecte ou que votre justificatif n'a pas été pris en compte, contactez le secrétariat de votre établissement.

### 5.5 Mon emploi du temps

**Accès :** Menu > Emploi du temps

Votre emploi du temps s'affiche sous forme de grille hebdomadaire :

- **Colonnes** : jours de la semaine (Lundi à Samedi selon votre établissement)
- **Lignes** : créneaux horaires
- **Cases colorées** : vos cours, avec :
  - Nom de la matière
  - Nom du professeur
  - Numéro ou nom de la salle

**Navigation :**
- Utilisez les flèches gauche/droite pour naviguer entre les semaines
- Cliquez sur **Cette semaine** pour revenir à la semaine actuelle
- Vue disponible aussi en format **liste** (toutes les matières avec les horaires)

### 5.6 Mes bulletins

**Accès :** Menu > Bulletins

Les bulletins sont disponibles dès qu'ils sont publiés par l'administration.

**Consulter un bulletin :**
1. Allez dans **Bulletins**
2. Sélectionnez le trimestre ou l'année scolaire
3. Cliquez sur **Voir le bulletin**
4. Le bulletin s'affiche avec toutes vos notes, moyennes et appréciations

**Télécharger un bulletin :**
1. Sur la page du bulletin, cliquez sur **Télécharger en PDF**
2. Le PDF est téléchargé sur votre appareil

> **Conseil :** Conservez vos bulletins téléchargés, ils peuvent être utiles pour des dossiers de candidature ou de bourses.

### 5.7 Devoirs LMS (si activé)

**Accès :** Menu > Devoirs

Si votre établissement utilise le module LMS, vous pouvez consulter et remettre vos devoirs en ligne.

**Voir les devoirs :**
1. Allez dans **Devoirs**
2. La liste des devoirs actifs s'affiche avec :
   - Titre et matière
   - Nom du professeur
   - Date limite de remise
   - Statut : À rendre / Rendu / En retard / Noté

**Remettre un devoir :**
1. Cliquez sur le devoir
2. Lisez la consigne et téléchargez les ressources si disponibles
3. Préparez votre travail hors ligne
4. De retour dans l'application, cliquez sur **Remettre le devoir**
5. Uploadez votre fichier (PDF, Word, ZIP...) ou collez votre texte selon le mode demandé
6. Cliquez sur **Confirmer la remise**
7. Vous recevez une confirmation avec l'heure de remise (preuve)

> **Important :** Une fois un devoir soumis, vous ne pouvez généralement pas le modifier. Vérifiez votre travail avant de confirmer la remise.

---

## 6. Portail Parent

### 6.1 Vue d'ensemble

Le portail parent permet de suivre la scolarité de votre enfant (ou de vos enfants si vous en avez plusieurs inscrits dans l'établissement). Il est en lecture seule.

### 6.2 Plusieurs enfants

Si vous avez plusieurs enfants inscrits dans l'établissement, un menu de sélection apparaît en haut de la page pour choisir l'enfant dont vous souhaitez voir les informations.

### 6.3 Tableau de bord parent

Le tableau de bord affiche les informations importantes sur votre enfant :

- **Dernière note** reçue
- **Dernière absence** enregistrée
- **Prochains devoirs** à rendre (LMS)
- **Solde des paiements** : montant dû éventuellement
- **Alertes** : absences non justifiées, notes en dessous d'un seuil

### 6.4 Notes de mon enfant

**Accès :** Menu > Notes

Même vue que le portail élève, mais avec quelques informations supplémentaires si l'admin a activé l'accès parent étendu :
- Comparaison avec la moyenne de la classe
- Évolution des notes dans le trimestre (graphique)
- Appréciations des professeurs

### 6.5 Présences de mon enfant

**Accès :** Menu > Présences

Consultez l'historique complet des présences et absences de votre enfant :

- **Vue mensuelle** : résumé du mois avec compteur présences/absences
- **Vue liste** : détail jour par jour
- Les absences justifiées apparaissent en vert, les non-justifiées en rouge

**En cas d'absence :**
Si votre enfant est absent, l'établissement vous contactera (notification push ou email selon la configuration). Pour justifier l'absence, vous devez contacter directement le secrétariat (en personne, par téléphone, ou via la messagerie interne).

### 6.6 Emploi du temps de mon enfant

**Accès :** Menu > Emploi du temps

Consultez l'emploi du temps hebdomadaire de votre enfant : cours, matières, professeurs, salles et horaires.

> **Pratique :** L'emploi du temps vous permet de savoir à quelle heure votre enfant termine ses cours chaque jour.

### 6.7 Bulletins

**Accès :** Menu > Bulletins

Dès qu'un bulletin est publié par l'administration, vous recevez une notification push et/ou un email.

**Consulter et télécharger :**
1. Allez dans **Bulletins**
2. Sélectionnez le trimestre
3. Cliquez sur **Voir le bulletin**
4. Téléchargez en PDF si nécessaire

### 6.8 Cahier de texte

**Accès :** Menu > Cahier de texte

Consultez ce qui a été fait en cours et les devoirs à faire pour la prochaine séance.

**Vue hebdomadaire :**
- Sélectionnez la semaine à consulter
- Les cours s'affichent avec leur contenu et les devoirs associés
- Filtrez par matière si nécessaire

> **Conseil :** Consultez le cahier de texte le soir pour aider votre enfant à préparer les devoirs du lendemain.

### 6.9 Paiements

**Accès :** Menu > Paiements

Consultez l'historique des paiements de scolarité de votre enfant :

- **État mensuel** : chaque mois avec son statut (Payé / Partiel / Non payé)
- **Montant attendu** : frais de scolarité mensuels
- **Montant payé** : ce qui a été reçu
- **Solde** : montant restant dû éventuellement
- **Reçus** : téléchargez les reçus des paiements effectués

> **Note :** Vous ne pouvez pas payer directement depuis l'application (selon la configuration de votre établissement). Le paiement se fait auprès du secrétariat selon les modes acceptés par l'école.

### 6.10 Messagerie avec l'établissement

**Accès :** Menu > Messages

Vous pouvez envoyer des messages à :
- Le secrétariat
- Les professeurs de votre enfant

**Envoyer un message :**
1. Cliquez sur **+ Nouveau message**
2. Sélectionnez le destinataire (secrétariat ou un professeur)
3. Rédigez votre message
4. Cliquez sur **Envoyer**

> **Note :** Les parents ne peuvent pas envoyer de messages aux autres parents ou aux élèves.

---

## 7. Fonctionnalités communes

### 7.1 Modifier son profil

Tous les utilisateurs peuvent modifier leurs informations personnelles :

1. Cliquez sur votre avatar/initiales en haut à droite
2. Cliquez sur **Mon profil**
3. Modifiez les informations souhaitées :
   - Prénom, nom
   - Numéro de téléphone
   - Photo de profil
4. Cliquez sur **Enregistrer**

> **Note :** L'adresse email (identifiant) ne peut pas être modifiée directement. Contactez l'administration.

### 7.2 Changer son mot de passe

1. Cliquez sur votre avatar > **Mon profil**
2. Cliquez sur **Changer le mot de passe**
3. Saisissez votre **mot de passe actuel**
4. Saisissez votre **nouveau mot de passe**
5. Confirmez le nouveau mot de passe
6. Cliquez sur **Enregistrer**

### 7.3 Gérer les notifications

**Accès :** Mon profil > Notifications

Choisissez quelles notifications vous souhaitez recevoir et par quel canal :

| Canal | Description |
|-------|-------------|
| Push (navigateur) | Notification dans votre navigateur (même si l'app est en arrière-plan) |
| Email | Email envoyé à votre adresse de connexion |

Vous pouvez activer ou désactiver chaque type de notification indépendamment.

**Activer les notifications push :**
1. Allez dans **Mon profil > Notifications**
2. Cliquez sur **Activer les notifications**
3. Autorisez les notifications dans la fenêtre de confirmation de votre navigateur
4. Vous recevrez désormais des notifications même lorsque l'application est en arrière-plan

### 7.4 Utiliser la messagerie

La messagerie est accessible à tous les utilisateurs selon les règles de communication autorisées par l'établissement.

**Boîte de réception :**
- Cliquez sur l'icône enveloppe en haut de la page
- Ou allez dans **Menu > Messages**
- Les messages non lus apparaissent en **gras**

**Répondre à un message :**
1. Ouvrez le message
2. Cliquez sur **Répondre**
3. Rédigez votre réponse
4. Cliquez sur **Envoyer**

---

## 8. Résolution des problèmes courants

### 8.1 Je ne reçois pas l'email d'invitation

**Causes possibles et solutions :**

| Cause | Solution |
|-------|----------|
| Email dans les spams | Vérifiez le dossier "Spam" ou "Courrier indésirable" |
| Adresse email incorrecte | Contactez le secrétariat pour corriger l'adresse |
| Lien expiré (> 24h) | Demandez au secrétariat de renvoyer l'invitation |
| Problème de réseau | Réessayez plus tard |

### 8.2 Je n'arrive pas à me connecter

**Vérifiez :**
- Que vous utilisez bien l'adresse email fournie lors de l'invitation
- Que le Verr. Maj. n'est pas activé lors de la saisie du mot de passe
- Que vous utilisez le bon mot de passe (en cas de doute, réinitialisez-le)

**Compte bloqué :** Après 5 tentatives échouées, votre compte est temporairement bloqué pendant 15 minutes. Attendez ou contactez l'administration.

### 8.3 Je ne vois pas mes notes / mes cours

**Causes possibles :**
- Les notes n'ont pas encore été saisies par le professeur
- Vous n'êtes pas assigné à la bonne classe — vérifiez auprès du secrétariat
- Le trimestre ou l'année scolaire active n'est pas configuré correctement — contactez l'administration

### 8.4 La page ne se charge pas / erreur

**Solutions :**
1. Rechargez la page (F5 ou bouton de rechargement du navigateur)
2. Videz le cache du navigateur (Ctrl+Maj+Suppr > Données en cache > Effacer)
3. Essayez dans un autre navigateur (Chrome recommandé)
4. Vérifiez votre connexion internet
5. Si le problème persiste, contactez le support

### 8.5 Je ne reçois pas les notifications push

**Solutions :**
1. Vérifiez que les notifications sont autorisées dans les paramètres de votre navigateur
2. Vérifiez que les notifications push sont activées dans votre profil EduTrack
3. Assurez-vous que votre navigateur n'est pas en mode "Ne pas déranger"
4. Essayez de déconnecter puis reconnecter votre appareil des notifications (Mon profil > Notifications)

### 8.6 Le PDF ne se télécharge pas

**Solutions :**
1. Vérifiez que votre navigateur ne bloque pas les téléchargements (paramètres du navigateur)
2. Vérifiez que vous avez suffisamment d'espace sur votre appareil
3. Essayez avec un autre navigateur
4. Désactivez temporairement les extensions de navigateur (bloqueurs de publicités peuvent interférer)

---

## Tableau récapitulatif des accès par rôle

| Fonctionnalité | Gestionnaire | Professeur | Élève | Parent |
|---------------|:---:|:---:|:---:|:---:|
| Tableau de bord | Oui | Oui | Oui | Oui |
| Liste élèves | Oui | Ses classes | Non | Non |
| Notes | Voir + Saisir | Ses cours | Ses notes | Notes enfant |
| Présences | Voir + Modifier | Faire l'appel | Ses présences | Présences enfant |
| Emploi du temps | Voir tout | Ses cours | Le sien | Celui enfant |
| Bulletins | Générer | Non | Les siens | Bulletins enfant |
| Paiements | Enregistrer | Non | Non | Consulter |
| Cahier de texte | Voir tout | Créer | Consulter | Consulter |
| Messages | Oui (tous) | Oui (admin+profs+parents classe) | Oui (limité) | Oui (admin+profs) |
| Admissions | Oui | Non | Non | Non |
| Comptabilité | Limitée | Non | Non | Non |

---

*Guide Utilisateurs EduTrack — Version 1.0 — Février 2026*
