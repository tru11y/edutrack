// ==================== WIRING ONLY ====================
// Chaque module exporte ses Cloud Functions.
// index.ts ne contient AUCUNE logique metier.

// Users
export { createUser } from "./modules/users/users.create";
export { deleteUser } from "./modules/users/users.delete";
export { toggleUserStatus } from "./modules/users/users.toggle";

// Paiements
export { createPaiement } from "./modules/paiements/paiements.create";
export { ajouterVersement } from "./modules/paiements/paiements.versement";
export { resetStatutPaiementMensuel } from "./modules/paiements/paiements.reset";
export { getStatsPaiementMensuel } from "./modules/paiements/paiements.stats";

// Comptabilite
export { createDepense, getDepenses, deleteDepense } from "./modules/compta/depenses";
export { createSalaire, getSalaires, updateSalaireStatut } from "./modules/compta/salaires";
export { getComptaStats } from "./modules/compta/compta.stats";

// Presences
export { marquerPresence } from "./modules/presences/presences.mark";
export { marquerPresenceBatch } from "./modules/presences/presences.batch";

// Cahier de texte
export { getAllCahierEntries } from "./modules/cahier/cahier.list";
export { getCahierTextesAdmin } from "./modules/cahier/cahier.admin";

// Stats / Dashboard
export { getAdminDashboardStats, getDetailedStats } from "./modules/stats/dashboard";

// Audit
export { getAuditLogs } from "./modules/audit/audit.logs";

// Reports
export {
  sendMonthlyPaymentReport,
  sendPaymentReportManual,
  configureReportEmail,
} from "./modules/reports/scheduled";
