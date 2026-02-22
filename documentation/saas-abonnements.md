# EduTrack — Modèle SaaS

> EduTrack est une plateforme multi-établissements. Chaque école dispose de son propre espace isolé. La facturation est gérée via Stripe.

---

## Plans envisagés

| Plan | Cible | Élèves max |
|------|-------|:----------:|
| Starter | Petite école (< 50 élèves) | 50 |
| Basic | École moyenne | 200 |
| Pro | Grand établissement | 500 |
| Enterprise | Multi-campus, illimité | Illimité |

> Les tarifs définitifs et l'interface de souscription seront activés lors du lancement commercial.

---

## Isolation des données

Chaque établissement (tenant) dispose de données strictement isolées grâce au champ `schoolId` présent sur chaque document Firestore. Un utilisateur ne peut jamais accéder aux données d'un autre établissement.

---

## Super Admin

Le propriétaire de la plateforme dispose d'un espace dédié pour :
- Voir tous les établissements inscrits
- Consulter les statistiques d'usage globales
- Gérer les abonnements et statuts

---

*EduTrack — Février 2026*
