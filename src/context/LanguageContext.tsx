import { createContext, useContext, useState, type ReactNode } from "react";

type Language = "fr" | "en";

// Traductions
const translations = {
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    students: "Eleves",
    myStudents: "Mes eleves",
    presences: "Presences",
    textbook: "Cahier de texte",
    payments: "Paiements",
    statistics: "Statistiques",
    users: "Utilisateurs",
    messages: "Messages",
    trash: "Corbeille",
    profile: "Mon profil",
    logout: "Deconnexion",

    // Roles
    admin: "Administrateur",
    gestionnaire: "Gestionnaire",
    prof: "Professeur",
    student: "Eleve",
    parent: "Parent",

    // Actions
    add: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    send: "Envoyer",
    search: "Rechercher",
    filter: "Filtrer",

    // Status
    active: "Actif",
    inactive: "Inactif",
    paid: "Paye",
    partial: "Partiel",
    unpaid: "Impaye",
    present: "Present",
    absent: "Absent",
    late: "Retard",

    // Common
    loading: "Chargement...",
    error: "Erreur",
    success: "Succes",
    noData: "Aucune donnee",
    total: "Total",
    date: "Date",
    time: "Heure",
    location: "Lieu",
    device: "Appareil",

    // Theme
    darkMode: "Mode nuit",
    lightMode: "Mode jour",

    // Language
    language: "Langue",
    french: "Francais",
    english: "Anglais",

    // Users
    connectedUsers: "Utilisateurs connectes",
    connectionLogs: "Historique des connexions",
    lastConnection: "Derniere connexion",
    online: "En ligne",
    offline: "Hors ligne",

    // Password
    resetPassword: "Reinitialiser le mot de passe",
    resetEmailSent: "Email de reinitialisation envoye",
    resetEmailError: "Erreur lors de l'envoi",

    // School management
    schoolManagement: "Gestion scolaire",
    professorSpace: "Espace Professeur",
    adminMode: "Mode Admin",
    profMode: "Mode Prof",

    // Payments
    newPayment: "Nouveau paiement",
    managePayments: "Gerez les paiements de tous les eleves",

    // Accounting
    accounting: "Comptabilite",

    // Notifications
    newMessage: "Nouveau message",
    newMessageFrom: "Nouveau message de",

    // Onboarding
    restartTour: "Revoir le guide",
    tourWelcome: "Bienvenue sur EduTrack !",
    next: "Suivant",
    skip: "Passer",
    done: "Terminer",
    back: "Retour",

    // Schedule
    schedule: "Emploi du temps",
    classes: "Classes",

    // Notes / Evaluations
    evaluations: "Evaluations",

    // V3
    discipline: "Discipline",
    matieres: "Matieres",
    importEleves: "Import eleves",
    parametres: "Parametres ecole",
    atRiskStudents: "Eleves a risque",
    riskAbsence: "Absences",
    riskPayment: "Impayes",
    riskGrades: "Notes",
    archives: "Archives",
    archiveYear: "Archiver une annee",
    conversations: "Conversations",
    attachments: "Pieces jointes",
    searchMessages: "Rechercher dans les messages",
    offlineMode: "Mode hors ligne",
    shortcuts: "Raccourcis clavier",
    // V4
    exportCSV: "Exporter CSV",
    offlineMessage: "Vous etes hors ligne. Les modifications seront synchronisees automatiquement.",
    offlineRetrying: "Synchronisation en cours...",
    offlineQueueCount: "operations en attente",
    skipToContent: "Aller au contenu principal",
    pushNotifications: "Notifications push",
    enablePush: "Activer les notifications push",
    disablePush: "Desactiver les notifications push",
    widgetConfig: "Configurer les widgets",
    showWidget: "Afficher",
    hideWidget: "Masquer",
    resetWidgets: "Reinitialiser",
    permissions: "Permissions",
    managePermissions: "Gerer les permissions",
    permissionGranted: "Permission accordee",
    permissionRevoked: "Permission revoquee",

    // SaaS / Tenant
    admissions: "Admissions",
    transport: "Transport",
    library: "Bibliotheque",
    hr: "Ressources humaines",
    lms: "Devoirs (LMS)",
    billing: "Abonnement",
    subscription: "Abonnement",
    freePlan: "Plan gratuit",
    upgradePlan: "Ameliorer le plan",
    currentPlan: "Plan actuel",
    maxStudents: "Nombre max d'eleves",
    superAdmin: "Super Admin",
    schoolManagementSaaS: "Gestion scolaire SaaS",
    createSchool: "Creer une ecole",
    allSchools: "Toutes les ecoles",
    platformStats: "Statistiques plateforme",
    leaveRequests: "Demandes de conge",
    assignments: "Devoirs",
    books: "Livres",
    routes: "Routes",
    // Cours du soir
    coursduSoir: "Cours du soir",
    soirEleves: "Élèves (soir)",
    soirPresences: "Présences (soir)",
    soirPaiements: "Paiements (soir)",
    soirCahier: "Cahier (soir)",
    soirEmploiDuTemps: "Emploi du temps (soir)",
    programmeSoir: "Cours du soir",
    programmeRegulier: "Enseignement régulier",
    // Activity logs
    activite: "Journal d'activité",
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    students: "Students",
    myStudents: "My students",
    presences: "Attendance",
    textbook: "Textbook",
    payments: "Payments",
    statistics: "Statistics",
    users: "Users",
    messages: "Messages",
    trash: "Trash",
    profile: "My profile",
    logout: "Logout",

    // Roles
    admin: "Administrator",
    gestionnaire: "Manager",
    prof: "Professor",
    student: "Student",
    parent: "Parent",

    // Actions
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    send: "Send",
    search: "Search",
    filter: "Filter",

    // Status
    active: "Active",
    inactive: "Inactive",
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
    present: "Present",
    absent: "Absent",
    late: "Late",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    noData: "No data",
    total: "Total",
    date: "Date",
    time: "Time",
    location: "Location",
    device: "Device",

    // Theme
    darkMode: "Dark mode",
    lightMode: "Light mode",

    // Language
    language: "Language",
    french: "French",
    english: "English",

    // Users
    connectedUsers: "Connected users",
    connectionLogs: "Connection logs",
    lastConnection: "Last connection",
    online: "Online",
    offline: "Offline",

    // Password
    resetPassword: "Reset password",
    resetEmailSent: "Reset email sent",
    resetEmailError: "Error sending email",

    // School management
    schoolManagement: "School management",
    professorSpace: "Professor Space",
    adminMode: "Admin Mode",
    profMode: "Prof Mode",

    // Payments
    newPayment: "New payment",
    managePayments: "Manage all student payments",

    // Accounting
    accounting: "Accounting",

    // Notifications
    newMessage: "New message",
    newMessageFrom: "New message from",

    // Onboarding
    restartTour: "Restart tour",
    tourWelcome: "Welcome to EduTrack!",
    next: "Next",
    skip: "Skip",
    done: "Done",
    back: "Back",

    // Schedule
    schedule: "Schedule",
    classes: "Classes",

    // Notes / Evaluations
    evaluations: "Evaluations",

    // V3
    discipline: "Discipline",
    matieres: "Subjects",
    importEleves: "Import students",
    parametres: "School settings",
    atRiskStudents: "At-risk students",
    riskAbsence: "Absences",
    riskPayment: "Unpaid",
    riskGrades: "Grades",
    archives: "Archives",
    archiveYear: "Archive year",
    conversations: "Conversations",
    attachments: "Attachments",
    searchMessages: "Search messages",
    offlineMode: "Offline mode",
    shortcuts: "Keyboard shortcuts",
    // V4
    exportCSV: "Export CSV",
    offlineMessage: "You are offline. Changes will be synced automatically.",
    offlineRetrying: "Syncing...",
    offlineQueueCount: "pending operations",
    skipToContent: "Skip to main content",
    pushNotifications: "Push notifications",
    enablePush: "Enable push notifications",
    disablePush: "Disable push notifications",
    widgetConfig: "Configure widgets",
    showWidget: "Show",
    hideWidget: "Hide",
    resetWidgets: "Reset",
    permissions: "Permissions",
    managePermissions: "Manage permissions",
    permissionGranted: "Permission granted",
    permissionRevoked: "Permission revoked",

    // SaaS / Tenant
    admissions: "Admissions",
    transport: "Transport",
    library: "Library",
    hr: "Human Resources",
    lms: "Assignments (LMS)",
    billing: "Billing",
    subscription: "Subscription",
    freePlan: "Free plan",
    upgradePlan: "Upgrade plan",
    currentPlan: "Current plan",
    maxStudents: "Max students",
    superAdmin: "Super Admin",
    schoolManagementSaaS: "SaaS School Management",
    createSchool: "Create school",
    allSchools: "All schools",
    platformStats: "Platform stats",
    leaveRequests: "Leave requests",
    assignments: "Assignments",
    books: "Books",
    routes: "Routes",
    // Cours du soir
    coursduSoir: "Evening classes",
    soirEleves: "Students (evening)",
    soirPresences: "Attendance (evening)",
    soirPaiements: "Payments (evening)",
    soirCahier: "Textbook (evening)",
    soirEmploiDuTemps: "Schedule (evening)",
    programmeSoir: "Evening classes",
    programmeRegulier: "Regular program",
    // Activity logs
    activite: "Activity log",
  },
};

export type TranslationKey = keyof typeof translations.fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved === "fr" || saved === "en") return saved;
    // Detecter la langue du navigateur
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "en" ? "en" : "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
