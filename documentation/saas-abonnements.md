# Abonnements et Modèle SaaS EduTrack

> Ce document décrit le modèle économique SaaS d'EduTrack, les plans d'abonnement, la facturation, les limites techniques et les modalités de gestion pour les établissements.

---

## Table des matières

1. [Présentation du modèle SaaS](#1-présentation-du-modèle-saas)
2. [Plans d'abonnement](#2-plans-dabonnement)
3. [Comparaison détaillée des plans](#3-comparaison-détaillée-des-plans)
4. [Facturation et paiement](#4-facturation-et-paiement)
5. [Gestion de l'abonnement](#5-gestion-de-labonnement)
6. [Limites et quotas](#6-limites-et-quotas)
7. [Changement de plan](#7-changement-de-plan)
8. [Période d'essai](#8-période-dessai)
9. [Politique d'annulation et remboursement](#9-politique-dannulation-et-remboursement)
10. [Facturation pour le plan Enterprise](#10-facturation-pour-le-plan-enterprise)
11. [FAQ Facturation](#11-faq-facturation)

---

## 1. Présentation du modèle SaaS

### Qu'est-ce que le SaaS ?

EduTrack est distribué selon le modèle **SaaS (Software as a Service)** : le logiciel est hébergé sur les serveurs EduTrack et accessible via un navigateur web, sans installation requise. L'établissement paye un abonnement mensuel ou annuel pour accéder au service.

### Avantages du modèle SaaS pour les établissements

| Avantage | Explication |
|----------|-------------|
| Aucune installation | Accessible immédiatement depuis n'importe quel navigateur |
| Mises à jour automatiques | Nouvelles fonctionnalités sans action de votre part |
| Infrastructure gérée | Sécurité, sauvegardes, disponibilité assurées par EduTrack |
| Coût prévisible | Abonnement fixe mensuel, sans surprise |
| Scalabilité | Changez de plan à tout moment selon vos besoins |
| Disponibilité | Accessible 24h/24, 7j/7 |

### Architecture multi-tenant

EduTrack est une plateforme **multi-tenant** : plusieurs établissements utilisent la même infrastructure technique, mais chaque établissement dispose d'un espace de données **totalement isolé** des autres. Cela signifie que :

- Les données d'un établissement ne sont jamais accessibles par un autre établissement
- Chaque document Firestore porte un champ `schoolId` unique identifiant l'établissement
- Les règles de sécurité Firebase garantissent l'isolation au niveau de la base de données
- Les administrateurs d'un établissement n'ont accès qu'à leur propre espace

---

## 2. Plans d'abonnement

EduTrack propose 4 plans adaptés à différentes tailles d'établissements.

### Plan Starter — Gratuit

Le plan Starter est conçu pour permettre à de petits établissements ou à de nouveaux utilisateurs de découvrir EduTrack sans engagement financier.

**Tarif :** 0€ / mois — Gratuit pour toujours

**Limite principale :** 50 élèves actifs maximum

**Idéal pour :**
- Établissements de petite taille (cours particuliers, petites écoles)
- Évaluation de la plateforme avant souscription à un plan payant
- Auto-écoles, centres de formation informels

### Plan Basic — 29€/mois

Le plan de base pour les établissements ayant des effectifs moyens.

**Tarif :** 29€ HT / mois (facturation mensuelle)

**Limite principale :** 200 élèves actifs maximum

**Idéal pour :**
- Petites écoles primaires ou maternelles
- Centres de soutien scolaire
- Établissements en croissance

### Plan Pro — 79€/mois

Le plan intermédiaire pour les établissements établis avec des besoins avancés.

**Tarif :** 79€ HT / mois (facturation mensuelle)

**Limite principale :** 500 élèves actifs maximum

**Idéal pour :**
- Collèges et lycées de taille moyenne
- Établissements d'enseignement supérieur (BTS, licences)
- Réseaux d'établissements de petite taille

### Plan Enterprise — 199€/mois

Le plan pour les grands établissements nécessitant une capacité illimitée et un support dédié.

**Tarif :** 199€ HT / mois (facturation mensuelle)
**Tarif annuel :** 1 990€ HT / an (économie de 2 mois)

**Limite principale :** Élèves illimités

**Idéal pour :**
- Grandes écoles et universités
- Réseaux d'établissements multiples
- Établissements avec des besoins spécifiques (intégrations, support dédié)

---

## 3. Comparaison détaillée des plans

### Tableau de comparaison

| Fonctionnalité | Starter | Basic | Pro | Enterprise |
|---------------|:-------:|:-----:|:---:|:----------:|
| **Prix mensuel** | Gratuit | 29€ | 79€ | 199€ |
| **Élèves actifs max** | 50 | 200 | 500 | Illimité |
| **Stockage fichiers** | 1 Go | 5 Go | 20 Go | 100 Go |
| **Professeurs** | Illimité | Illimité | Illimité | Illimité |
| **Classes** | Illimité | Illimité | Illimité | Illimité |
| **Utilisateurs** | Illimité | Illimité | Illimité | Illimité |

### Fonctionnalités par plan

| Module | Starter | Basic | Pro | Enterprise |
|--------|:-------:|:-----:|:---:|:----------:|
| Tableau de bord | Oui | Oui | Oui | Oui |
| Gestion élèves | Oui | Oui | Oui | Oui |
| Gestion classes | Oui | Oui | Oui | Oui |
| Gestion professeurs | Oui | Oui | Oui | Oui |
| Emploi du temps | Oui | Oui | Oui | Oui |
| Présences | Oui | Oui | Oui | Oui |
| Évaluations & Notes | Oui | Oui | Oui | Oui |
| Bulletins PDF | Oui | Oui | Oui | Oui |
| Paiements | Oui | Oui | Oui | Oui |
| Messagerie interne | Oui | Oui | Oui | Oui |
| Notifications push | Oui | Oui | Oui | Oui |
| Cahier de texte | Oui | Oui | Oui | Oui |
| Import CSV | Non | Oui | Oui | Oui |
| Comptabilité avancée | Non | Oui | Oui | Oui |
| Admissions | Non | Oui | Oui | Oui |
| Transport | Non | Non | Oui | Oui |
| Bibliothèque | Non | Non | Oui | Oui |
| RH / Congés | Non | Non | Oui | Oui |
| LMS devoirs en ligne | Non | Non | Oui | Oui |
| Analytics avancées | Non | Non | Oui | Oui |
| Journal d'audit | Non | Partiel | Oui | Oui |
| Archives | Non | Oui | Oui | Oui |
| Discipline | Non | Oui | Oui | Oui |
| API d'intégration | Non | Non | Non | Oui |
| SSO (SAML/OAuth) | Non | Non | Non | Oui |
| Personnalisation avancée | Non | Non | Non | Oui |

### Support client

| Niveau de support | Starter | Basic | Pro | Enterprise |
|-------------------|:-------:|:-----:|:---:|:----------:|
| Documentation en ligne | Oui | Oui | Oui | Oui |
| Support par email | Non | Oui | Oui | Oui |
| Délai de réponse email | — | 72h | 24h | 4h |
| Support prioritaire | Non | Non | Oui | Oui |
| Account manager dédié | Non | Non | Non | Oui |
| Onboarding assisté | Non | Non | Oui | Oui |
| Formation personnalisée | Non | Non | Non | Oui |

---

## 4. Facturation et paiement

### Moyens de paiement acceptés

EduTrack utilise **Stripe** pour traiter tous les paiements. Les moyens de paiement acceptés sont :

| Moyen de paiement | Disponibilité |
|-------------------|:-------------:|
| Carte bancaire Visa | Oui |
| Carte bancaire Mastercard | Oui |
| Carte bancaire American Express | Oui |
| Virement SEPA (Enterprise) | Oui |
| Bon de commande / facturation différée (Enterprise) | Sur demande |

### Cycle de facturation

**Facturation mensuelle :**
- Le prélèvement a lieu le même jour chaque mois (jour de souscription)
- Exemple : souscription le 15 février → prélèvement le 15 de chaque mois
- Si le jour n'existe pas dans le mois (ex. : le 31), prélèvement le dernier jour du mois

**Facturation annuelle (Enterprise uniquement) :**
- Règlement en une fois pour 12 mois
- Économie équivalente à 2 mois offerts (1 990€ au lieu de 2 388€)
- Facture unique émise en début de période

### Factures

- Une facture PDF est générée automatiquement à chaque prélèvement
- La facture est envoyée par email à l'adresse de facturation de l'établissement
- Toutes les factures sont également consultables dans **Paramètres > Abonnement > Historique des factures**

**Contenu de la facture :**
- Numéro de facture unique
- Période de facturation
- Plan souscrit
- Montant HT, TVA (20%), montant TTC
- Coordonnées de l'établissement et d'EduTrack
- Conformité aux exigences légales françaises

### TVA

- EduTrack est assujetti à la TVA française au taux de **20%**
- Les établissements situés dans l'UE hors France peuvent être exonérés de TVA française avec un numéro de TVA intracommunautaire valide
- Les établissements hors UE ne paient pas de TVA française

---

## 5. Gestion de l'abonnement

### Accéder à la gestion de l'abonnement

**Accès :** Paramètres > Abonnement (réservé au rôle Admin)

La page d'abonnement affiche :

```
┌─────────────────────────────────────────────────────────┐
│  Plan actuel : Pro — 79€/mois                           │
│  Renouvellement : 15 mars 2026                          │
│  ─────────────────────────────────────────────────────  │
│  Élèves actifs : 312 / 500 (62%)  ████████░░░           │
│  Stockage utilisé : 8.2 Go / 20 Go                      │
│  ─────────────────────────────────────────────────────  │
│  [Changer de plan]  [Gérer le paiement]  [Factures]     │
└─────────────────────────────────────────────────────────┘
```

### Portail de facturation Stripe

Depuis la page d'abonnement, le bouton **Gérer le paiement** ouvre le portail client Stripe. Ce portail sécurisé permet de :
- Mettre à jour la carte bancaire
- Voir et télécharger toutes les factures
- Annuler l'abonnement
- Modifier l'adresse de facturation

### Alertes automatiques

Le système envoie des alertes email et notifications push dans les situations suivantes :

| Situation | Alerte envoyée | Délai |
|-----------|---------------|-------|
| 80% de la limite d'élèves atteinte | Email + Push | Immédiat |
| 100% de la limite atteinte | Email + Push + bannière | Immédiat |
| Paiement échoué | Email | Immédiat |
| Paiement toujours échoué | Email + notification admin | J+3 |
| Abonnement suspendu (paiement) | Email | J+7 |
| Renouvellement dans 7 jours | Email | J-7 |

---

## 6. Limites et quotas

### Limite d'élèves actifs

La limite d'élèves actifs est le principal quota de chaque plan. Un **élève actif** est un élève avec le statut "actif" dans le système.

**Que se passe-t-il quand la limite est atteinte ?**

1. À 80% : alerte email et notification push à l'admin
2. À 100% : il n'est plus possible d'activer de nouveaux élèves. Les élèves existants fonctionnent normalement
3. Pour dépasser la limite : upgrade vers un plan supérieur requis

**Élèves inactifs :** Les élèves désactivés ne comptent pas dans le quota. Désactiver un élève libère une place.

**Import CSV :** Si un import CSV dépasse la limite, les élèves au-delà du quota ne sont pas créés. Le rapport d'import indique combien ont été ignorés pour cette raison.

### Stockage fichiers

Le stockage concerne les fichiers uploadés : photos, bulletins PDF, pièces jointes, documents RH, etc.

**Que se passe-t-il quand le stockage est plein ?**
- Les nouveaux uploads sont refusés
- Les fonctionnalités qui nécessitent un upload (photos, justificatifs) affichent une erreur
- La génération de PDF reste fonctionnelle (les PDF sont temporaires)

**Pour libérer du stockage :**
- Supprimez les fichiers inutiles depuis la section correspondante
- Videz la corbeille
- Ou upgradez vers un plan avec plus de stockage

### Rétention des données

| Type de données | Durée de conservation |
|----------------|----------------------|
| Données actives | Durée de l'abonnement |
| Données archivées | 3 ans après archivage |
| Données corbeille | 90 jours |
| Journal d'audit | 1 an glissant |
| Factures | 10 ans (obligations légales) |

**Après résiliation :** Les données sont conservées pendant 60 jours après la résiliation, permettant à l'établissement d'exporter ses données. Passé ce délai, les données sont supprimées définitivement.

---

## 7. Changement de plan

### Upgrade (passage à un plan supérieur)

**Processus :**
1. Allez dans **Paramètres > Abonnement**
2. Cliquez sur **Changer de plan**
3. Sélectionnez le plan supérieur
4. Confirmez le paiement via le portail Stripe
5. Le nouveau plan est actif **immédiatement**

**Facturation lors d'un upgrade :**
La facturation est calculée au **prorata** du temps restant dans la période :

**Exemple :**
- Vous êtes sur le plan Basic à 29€/mois
- Vous upgradez vers Pro (79€/mois) le 15 du mois (il reste 15 jours sur 30)
- Vous payez : (79 - 29) × (15/30) = 25€ pour la fin du mois en cours
- À partir du mois suivant : 79€/mois normalement

### Downgrade (passage à un plan inférieur)

**Conditions :**
- Le downgrade prend effet à la **prochaine date de renouvellement** (pas immédiatement)
- Si votre nombre d'élèves actifs dépasse la limite du plan inférieur, le downgrade est bloqué jusqu'à ce que vous désactiviez suffisamment d'élèves

**Processus :**
1. Allez dans **Paramètres > Abonnement**
2. Cliquez sur **Changer de plan**
3. Sélectionnez le plan inférieur
4. Confirmez — le changement est programmé
5. Un email de confirmation est envoyé avec la date d'effet

**Fonctionnalités perdues lors d'un downgrade :**
Les fonctionnalités non disponibles dans le plan inférieur passent en lecture seule pendant 30 jours, vous permettant d'exporter vos données avant leur désactivation définitive.

---

## 8. Période d'essai

### Plan Starter (essai gratuit permanent)

Le plan Starter est gratuit sans limitation de durée, jusqu'à 50 élèves. Il n'y a pas de période d'essai distincte : vous pouvez utiliser le plan Starter indéfiniment.

### Essai des fonctionnalités Pro

Certaines fonctionnalités Pro peuvent être accessibles en mode démonstration depuis le plan Basic :
- Mode "Démo" avec données fictives
- Pas de modification possible en mode démo
- Bouton **Essayer Pro** disponible dans les modules concernés

### Onboarding assisté (plans Pro et Enterprise)

Lors de la souscription aux plans Pro et Enterprise, un onboarding assisté est proposé :
- Appel de configuration avec un membre de l'équipe EduTrack (30-60 min)
- Aide à la configuration initiale (établissement, classes, import élèves)
- Formation basique aux fonctionnalités principales

---

## 9. Politique d'annulation et remboursement

### Annulation

L'abonnement peut être annulé à tout moment depuis le portail de facturation Stripe (**Paramètres > Abonnement > Gérer le paiement**).

**Effets de l'annulation :**
- L'abonnement reste actif jusqu'à la fin de la période en cours (pas de remboursement prorata pour les plans mensuels)
- Aucun prélèvement supplémentaire n'est effectué après l'annulation
- Un email de confirmation est envoyé
- Les données sont conservées 60 jours après la fin de la période, puis supprimées

### Remboursements

| Situation | Politique |
|-----------|-----------|
| Annulation en cours de mois (plan mensuel) | Pas de remboursement — accès conservé jusqu'à la fin du mois |
| Paiement en double (erreur technique) | Remboursement intégral sous 5 jours ouvrés |
| Problème technique majeur (> 24h de coupure) | Avoir sur la prochaine facture |
| Annulation plan annuel dans les 14 jours | Remboursement intégral (droit de rétractation légal) |
| Annulation plan annuel après 14 jours | Remboursement prorata du temps restant |

### Procédure de demande de remboursement

1. Envoyez un email à **billing@edutrack.app** avec :
   - Nom de votre établissement
   - Numéro de la facture concernée
   - Motif de la demande de remboursement
2. L'équipe EduTrack répond sous 48h ouvrées
3. Si le remboursement est accordé, il est crédité sur le moyen de paiement original sous 5-10 jours ouvrés

---

## 10. Facturation pour le plan Enterprise

### Options de facturation spécifiques

Le plan Enterprise bénéficie d'options de facturation adaptées aux grandes organisations :

**Facturation annuelle :**
- Règlement annuel unique : 1 990€ HT / an (vs 2 388€ sur 12 mois)
- Économie de 398€ par an (2 mois offerts)
- Facture unique émise en début de période

**Bon de commande (Purchase Order) :**
- Sur demande, EduTrack peut établir un devis / bon de commande
- Paiement par virement bancaire possible
- Délai de paiement : 30 jours nets
- Contact : **enterprise@edutrack.app**

**Facturation multi-établissements :**
Pour les groupes scolaires ou réseaux d'établissements, une facturation consolidée est possible :
- Un seul contrat pour plusieurs établissements
- Tarifs dégressifs selon le nombre d'établissements :

| Nombre d'établissements | Remise |
|------------------------|:------:|
| 2-5 établissements | 10% |
| 6-10 établissements | 20% |
| 11+ établissements | Sur devis |

### Fonctionnalités exclusives Enterprise

**API d'intégration :**
Accès à l'API REST EduTrack pour intégration avec d'autres systèmes (ERP, CRM, logiciel comptable, autre LMS...).

**SSO (Single Sign-On) :**
Connexion via votre système d'authentification d'entreprise :
- SAML 2.0
- OAuth 2.0 / OpenID Connect
- Active Directory / LDAP (via connecteur)

**Personnalisation avancée :**
- URL personnalisée (sous-domaine : `monecole.edutrack.app`)
- Template d'emails entièrement personnalisables
- Fonctionnalités sur mesure (développement spécifique)

**Support dédié :**
- Account manager dédié avec numéro de téléphone direct
- SLA de disponibilité garanti (99.9%)
- Réponse aux incidents critiques en moins de 2 heures

---

## 11. FAQ Facturation

### Que se passe-t-il si je dépasse ma limite d'élèves ?

Vous ne pouvez plus ajouter ni réactiver d'élèves tant que vous n'avez pas soit désactivé des élèves existants, soit upgradé vers un plan supérieur. Les élèves existants et toutes les fonctionnalités restent opérationnels.

### Puis-je changer de plan en cours de mois ?

Oui. Un upgrade prend effet immédiatement avec facturation au prorata. Un downgrade prend effet à la prochaine date de renouvellement.

### Mes données sont-elles sécurisées si je n'ai pas payé ?

En cas d'échec de paiement, nous vous accordons une période de grâce de 7 jours avant suspension. Pendant cette période, toutes vos données sont conservées et accessibles. Si la situation n'est pas régularisée, l'accès est suspendu (données conservées mais inaccessibles). Après 60 jours de suspension sans régularisation, les données sont supprimées.

### Est-ce que je peux exporter mes données si je résilie ?

Oui. Pendant les 60 jours suivant la résiliation, vous conservez un accès en lecture seule et pouvez exporter toutes vos données (élèves, notes, paiements, bulletins) en format CSV et PDF.

### Proposez-vous des tarifs réduits pour les établissements publics ou associations ?

Nous proposons des tarifs sociaux pour certaines structures (associations loi 1901, établissements d'enseignement dans des zones défavorisées). Contactez **contact@edutrack.app** avec votre dossier pour étude.

### La TVA est-elle incluse dans les prix affichés ?

Non. Les prix affichés sont en **HT (Hors Taxes)**. La TVA de 20% s'applique pour les établissements situés en France et dans les pays de l'UE n'ayant pas de numéro de TVA intracommunautaire valide.

**Exemples TTC :**
- Starter : 0€
- Basic : 29€ HT × 1.20 = **34,80€ TTC/mois**
- Pro : 79€ HT × 1.20 = **94,80€ TTC/mois**
- Enterprise : 199€ HT × 1.20 = **238,80€ TTC/mois**

### Comment ajouter plusieurs établissements ?

Chaque établissement est un compte séparé avec son propre abonnement. Pour gérer plusieurs établissements depuis un seul compte, contactez l'équipe Enterprise. Des tarifs groupés et une vue consolidée multi-établissements sont disponibles.

### La plateforme est-elle conforme au RGPD ?

Oui. EduTrack est conforme au Règlement Général sur la Protection des Données (RGPD) :
- Les données sont hébergées dans l'UE (région `europe-west1`, Belgique)
- Un DPA (Data Processing Agreement) est disponible sur demande
- Droit à l'effacement des données garanti
- Registre des traitements maintenu
- Contact DPO : **dpo@edutrack.app**

---

## Récapitulatif tarifaire

| Plan | Mensuel HT | Annuel HT | Élèves | Recommandé pour |
|------|:----------:|:---------:|:------:|----------------|
| Starter | 0€ | 0€ | 50 | Découverte, très petites structures |
| Basic | 29€ | 348€ | 200 | Petits établissements |
| Pro | 79€ | 948€ | 500 | Établissements de taille moyenne |
| Enterprise | 199€ | 1 990€ | Illimité | Grands établissements, réseaux |

*Tous les prix sont en euros HT. TVA applicable selon la situation de l'établissement.*

---

*Documentation Abonnements EduTrack — Version 1.0 — Février 2026*
*Pour toute question commerciale : commercial@edutrack.app*
*Pour toute question de facturation : billing@edutrack.app*
