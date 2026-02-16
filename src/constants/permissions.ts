export const PERMISSIONS = {
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_PAYMENTS: "MANAGE_PAYMENTS",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  MANAGE_DISCIPLINE: "MANAGE_DISCIPLINE",
  MANAGE_NOTES: "MANAGE_NOTES",
  MANAGE_PRESENCES: "MANAGE_PRESENCES",
  MANAGE_EMPLOI: "MANAGE_EMPLOI",
  MANAGE_CAHIER: "MANAGE_CAHIER",
  MANAGE_CLASSES: "MANAGE_CLASSES",
  MANAGE_COMPTA: "MANAGE_COMPTA",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",
  MANAGE_NOTIFICATIONS: "MANAGE_NOTIFICATIONS",
  EXPORT_DATA: "EXPORT_DATA",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  gestionnaire: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.MANAGE_USERS),
  prof: [
    PERMISSIONS.MANAGE_NOTES,
    PERMISSIONS.MANAGE_PRESENCES,
    PERMISSIONS.MANAGE_CAHIER,
  ],
  eleve: [],
  parent: [],
};

export const PERMISSION_LABELS: Record<Permission, { fr: string; en: string }> = {
  MANAGE_USERS: { fr: "Gerer les utilisateurs", en: "Manage users" },
  MANAGE_PAYMENTS: { fr: "Gerer les paiements", en: "Manage payments" },
  VIEW_ANALYTICS: { fr: "Voir les analytiques", en: "View analytics" },
  MANAGE_DISCIPLINE: { fr: "Gerer la discipline", en: "Manage discipline" },
  MANAGE_NOTES: { fr: "Gerer les notes", en: "Manage grades" },
  MANAGE_PRESENCES: { fr: "Gerer les presences", en: "Manage attendance" },
  MANAGE_EMPLOI: { fr: "Gerer l'emploi du temps", en: "Manage schedule" },
  MANAGE_CAHIER: { fr: "Gerer le cahier de texte", en: "Manage textbook" },
  MANAGE_CLASSES: { fr: "Gerer les classes", en: "Manage classes" },
  MANAGE_COMPTA: { fr: "Gerer la comptabilite", en: "Manage accounting" },
  VIEW_AUDIT_LOGS: { fr: "Voir les logs d'audit", en: "View audit logs" },
  MANAGE_NOTIFICATIONS: { fr: "Gerer les notifications", en: "Manage notifications" },
  EXPORT_DATA: { fr: "Exporter les donnees", en: "Export data" },
};
