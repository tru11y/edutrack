# EduTrack — Logiciel de gestion scolaire

Application web complète de gestion d'établissement scolaire, conçue pour les écoles d'Afrique de l'Ouest (contexte CEDEAO/UEMOA).

**Stack :** React 18 + TypeScript + Vite · Firebase (Firestore, Auth, Functions, Hosting) · jsPDF · i18n FR/EN

---

## Fonctionnalités

### Gestion des élèves
- Fiche élève complète (inscriptions, classe, parent, statut)
- Import CSV en masse
- Archivage de fin d'année scolaire
- Corbeille (soft-delete)

### Présences
- Appel quotidien par classe (présent / absent / retard)
- Historique et statistiques par élève
- Export Excel

### Paiements & Reçus PDF
- Enregistrement des paiements mensuels (versements partiels)
- Reçu PDF personnalisé : couleurs de l'école, logo, nom/prénom/classe corrects
- Export depuis toutes les vues : admin, élève par élève, espace parent, cours du soir
- Nom de fichier : `Recu_{Prenom}_{Nom}_{Classe}_{MM}-{YYYY}.pdf`

### Cours du soir
- Programme séparé (gestionnaire/prof dédiés)
- Élèves, présences, paiements, cahier, emploi du temps soir
- Reçus PDF disponibles depuis la liste des paiements soir
- Classes : Alphabétisation, CP1, CP2, CE1, CE2, CM1, CM2

### Emploi du temps
- Vue calendrier par classe ou par professeur
- Créneaux simultanés côte à côte
- Filtre par classe · Export PDF/Excel · Import Excel drag & drop

### Comptabilité
- Dépenses, salaires, recettes
- Tableau de bord financier (calcul client-side, pas de Cloud Function fragile)

### Intelligence Artificielle (`/ia`)
- Moteur de recommandations : 8 indicateurs surveillés
  - Taux de recouvrement financier (+ tendance sur 3 mois)
  - Taux de présence, moyenne générale des notes
  - Ratio élèves/enseignant, emploi du temps, cahier de texte
  - Effectif de l'établissement, paiements partiels persistants
- Élèves à risque : croise absences > 30 %, mois impayés ≥ 2, moyenne < 8/20
- Rapport PDF téléchargeable

### Sauvegardes (`/sauvegarde`)
- Export manuel (JSON complet + rapport PDF de synthèse)
- **Sauvegarde automatique chaque lundi 06h00 WAT** (Cloud Function schedulée)
- Envoi vers OneDrive (Power Automate) ou Google Drive (Apps Script) via webhook
- Webhook configurable dans Paramètres école ou page Sauvegardes
- Historique des sauvegardes avec statut webhook

### Paramètres école (`/parametres`)
- Nom, adresse, téléphone, email, année scolaire
- Logo (upload → canvas resize → base64 PNG, stocké dans Firestore)
- Couleur principale (appliquée au thème UI + reçus PDF)
- URL webhook de sauvegarde automatique

### Journal d'activité (`/activite`)
- Trace toutes les actions admin/gestionnaire (création, modification, suppression)
- Filtre par type d'action et entité · Dernières 200 entrées

### Portails élève & parent
- Tableau de bord, notes, présences, emploi du temps, paiements, cahier

### Messagerie interne
- Conversations entre utilisateurs de l'école

---

## Architecture

```
edutrack/
├── src/
│   ├── context/          # ThemeContext, AuthContext, SchoolContext, LanguageContext, TenantContext
│   ├── Layout/           # AdminLayout (sidebar, nav, NotificationBell)
│   ├── modules/          # Domaines métier (eleves, paiements, soir, parent, eleve, analytics...)
│   ├── pages/            # Pages principales (Dashboard, PaiementsList, SchoolSettings, AIPage, Backup...)
│   ├── services/         # cloudFunctions.ts, firebase.ts, activityLogger.ts, adminNotifications.ts
│   └── components/       # UI réutilisables (NotificationBell, GlobalSearch, ErrorBoundary...)
├── functions/
│   └── src/modules/
│       ├── backup/       # backup.export.ts (exportSchoolBackup + weeklyBackup)
│       ├── recommendations/ # recommendations.ts (moteur IA)
│       ├── stats/        # dashboard.ts, risk.students.ts
│       ├── paiements/    # create, versement, reset, stats
│       ├── presences/    # mark, batch
│       └── ...           # users, notes, compta, emploi, exports, etc.
└── firestore.rules
```

### Patterns clés
- **Inline styles** partout (pas de Tailwind) — ne pas mélanger
- `useTheme().colors` pour toutes les couleurs
- `useSchool()` pour les données de l'école (nom, logo, couleur, webhook…)
- Tous les appels Cloud Function passent par `src/services/cloudFunctions.ts`
- Logo stocké en base64 PNG dans Firestore (pas Firebase Storage)
- `src/Pages/` (P majuscule) sur Windows, importé `./pages/` (minuscule) — les deux fonctionnent

---

## Déploiement

```bash
# Frontend
npx vite build
npx firebase deploy --only hosting

# Cloud Functions (toutes)
cd functions && npm run build
npx firebase deploy --only functions

# Cloud Functions spécifiques
npx firebase deploy --only functions:exportSchoolBackup,functions:weeklyBackup,functions:getRecommendations
```

**URL de production :** https://edutrak-7a344.web.app

---

## Cloud Functions déployées

| Fonction | Déclencheur | Description |
|---|---|---|
| `exportSchoolBackup` | Callable | Export manuel toutes collections + envoi webhook |
| `weeklyBackup` | Scheduled (lundi 06h WAT) | Sauvegarde auto toutes les écoles |
| `getRecommendations` | Callable | Moteur IA — recommandations établissement |
| `getAtRiskStudents` | Callable | Élèves à risque (absences, impayés, notes) |
| `getAdminDashboardStats` | Callable | KPI tableau de bord |
| `createPaiement` | Callable | Enregistrer paiement + versements |
| `marquerPresenceBatch` | Callable | Appel de présence (batch) |
| `exportElevesExcel` | Callable | Export Excel élèves |
| … | … | 50+ autres fonctions |

---

## Configuration sauvegarde OneDrive / Google Drive

### OneDrive (Power Automate)
1. Créer un flux → Trigger : *"Lors de la réception d'une requête HTTP"*
2. Action : *"Créer un fichier"* dans votre dossier OneDrive
3. Nom fichier : `backup_@{triggerBody()?['exportedAt']}.json`
4. Contenu : `@{triggerBody()}`
5. Coller l'URL HTTP POST dans **Paramètres école → URL Webhook de sauvegarde**

### Google Drive (Apps Script)
```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folder = DriveApp.getFolderById("VOTRE_FOLDER_ID");
  folder.createFile("backup_" + data.exportedAt + ".json", e.postData.contents, "application/json");
  return ContentService.createTextOutput("OK");
}
```
Déployer → Web App → Accès : Tout le monde → coller l'URL dans les paramètres.

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Tout — paramètres, comptabilité, sauvegardes, IA, utilisateurs |
| `gestionnaire` | Élèves, présences, paiements, stats, messages (pas comptabilité ni paramètres) |
| `prof` | Présences, cahier, mes élèves, emploi du temps |
| `prof (soir)` | Uniquement section cours du soir |
| `eleve` | Portail élève (notes, présences, emploi du temps) |
| `parent` | Portail parent (notes, présences, paiements, cahier) |
