// ==================== WIRING ONLY ====================
// Chaque module exporte ses Cloud Functions.
// index.ts ne contient AUCUNE logique metier.

// Users
export { createUser } from "./modules/users/users.create";
export { deleteUser } from "./modules/users/users.delete";
export { toggleUserStatus } from "./modules/users/users.toggle";
export { getUserPermissionsFunction as getUserPermissions, updateUserPermissions } from "./modules/users/users.permissions";

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

// Notes / Evaluations
export { createEvaluation } from "./modules/notes/evaluations.create";
export { updateEvaluation } from "./modules/notes/evaluations.update";
export { deleteEvaluation } from "./modules/notes/evaluations.delete";
export { getEvaluationsByClasse } from "./modules/notes/evaluations.list";
export { createNote, createNotesBatch } from "./modules/notes/notes.create";
export { updateNote } from "./modules/notes/notes.update";
export { deleteNote } from "./modules/notes/notes.delete";
export { getNotesByEvaluation, getNotesByEleve } from "./modules/notes/notes.list";
export { calculateMoyennes } from "./modules/notes/moyennes.calculate";
export { generateBulletin, generateBulletinsClasse } from "./modules/notes/bulletins.generate";
export { getBulletinVersions, compareBulletinVersions } from "./modules/notes/bulletins.versions";

// Advanced Stats
export { getAdvancedStats } from "./modules/stats/advanced.stats";
export { getClasseComparison } from "./modules/stats/classe.comparison";

// Exports
export { exportElevesExcel } from "./modules/exports/eleves.export";
export { exportPresencesExcel } from "./modules/exports/presences.export";
export { exportNotesExcel } from "./modules/exports/notes.export";
export { exportPaiementsExcel } from "./modules/exports/paiements.export";

// Notifications
export { sendNotification } from "./modules/notifications/notifications.create";
export { getNotifications } from "./modules/notifications/notifications.list";
export { markNotificationRead } from "./modules/notifications/notifications.read";
export { getNotificationConfig, updateNotificationConfig } from "./modules/notifications/notifications.config";
export { triggerAbsenceNotification } from "./modules/notifications/triggers.absence";
export { triggerImpayeNotification } from "./modules/notifications/triggers.impaye";
export { sendBulkNotification } from "./modules/notifications/notifications.send.bulk";
export { processNotificationQueue } from "./modules/notifications/queue.process";

// Discipline
export { createDisciplineRecord } from "./modules/discipline/discipline.create";
export { getDisciplineRecords } from "./modules/discipline/discipline.list";
export { updateDisciplineRecord } from "./modules/discipline/discipline.update";
export { deleteDisciplineRecord } from "./modules/discipline/discipline.delete";

// Matieres
export { getMatieres, createMatiere, updateMatiere, deleteMatiere } from "./modules/matieres/matieres.crud";

// CSV Import
export { importElevesCsv } from "./modules/imports/eleves.import";

// Emploi du temps
export { createCreneauBatch } from "./modules/emploi/creneaux.batch";
export { updateCreneau } from "./modules/emploi/creneaux.update";
export { checkScheduleConflicts } from "./modules/emploi/conflicts.check";
export { getEmploiDuTempsClasse, getEmploiDuTempsProf } from "./modules/emploi/emploi.list";

// At-risk students
export { getAtRiskStudents } from "./modules/stats/risk.students";

// Class management
export { promoteClasse } from "./modules/classes/promotion";
export { archiveAnneeScolaire } from "./modules/classes/archive";

// Analytics
export { getAnalyticsReport } from "./modules/analytics/reports";

// Schools (Multi-tenant)
export { createSchool } from "./modules/schools/schools.create";
export { updateSchool } from "./modules/schools/schools.update";
export { listSchools } from "./modules/schools/schools.list";
export { getSchoolsStats } from "./modules/schools/schools.stats";

// Billing
export { createCheckoutSession } from "./modules/billing/billing.checkout";
export { stripeWebhook } from "./modules/billing/billing.webhook";
export { createBillingPortalSession } from "./modules/billing/billing.portal";

// Admissions
export { createAdmission } from "./modules/admissions/admissions.create";
export { listAdmissions } from "./modules/admissions/admissions.list";
export { updateAdmission } from "./modules/admissions/admissions.update";

// Transport
export { createRoute, updateRoute, deleteRoute, listRoutes, assignStudentToRoute } from "./modules/transport/transport.crud";

// Library
export { createBook, updateBook, deleteBook, listBooks, borrowBook, returnBook } from "./modules/library/library.crud";

// HR
export { createLeaveRequest, listLeaveRequests, updateLeaveRequest } from "./modules/hr/hr.leave";

// LMS
export { createAssignment, listAssignments, submitAssignment, gradeSubmission } from "./modules/lms/lms.assignments";
