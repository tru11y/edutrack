import { httpsCallable } from "firebase/functions";
import { functions, ensureAuth } from "./firebase";
import { enqueueOperation, processQueue } from "../utils/offlineQueue";

async function callFunction<T, R>(name: string, data?: T): Promise<R> {
  await ensureAuth();
  const fn = httpsCallable<T, R>(functions, name);
  try {
    const result = await fn(data as T);
    return result.data;
  } catch (error: unknown) {
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("network"));
    if (isNetworkError && !navigator.onLine) {
      enqueueOperation(name, data);
      throw new Error("OFFLINE_QUEUED");
    }
    throw error;
  }
}

export async function retryQueue(): Promise<{ processed: number; failed: number }> {
  return processQueue(async (fnName, fnData) => {
    await ensureAuth();
    const fn = httpsCallable(functions, fnName);
    await fn(fnData);
  });
}

export interface CreateUserParams {
  email: string;
  password: string;
  role: "admin" | "gestionnaire" | "prof" | "eleve" | "parent";
  nom?: string;
  prenom?: string;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
}

export interface CreateUserResult {
  success: boolean;
  uid: string;
  message: string;
}

export interface CreatePaiementParams {
  eleveId: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  datePaiement: string;
}

export interface CreatePaiementResult {
  success: boolean;
  id: string;
  message: string;
}

export interface ToggleUserStatusParams {
  userId: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  eleveNom?: string;
  montant?: number;
  mois?: string;
  performedBy: string;
  performedByName?: string;
  timestamp: string;
}

export interface CahierEntryEleve {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
}

export interface CahierEntryAdmin {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  profId: string;
  profNom: string;
  contenu: string;
  devoirs: string;
  isSigned: boolean;
  signedAt: string | null;
  eleves: string[];
  elevesDetails: CahierEntryEleve[];
  createdAt: string | null;
}

export interface GetCahierTextesAdminParams {
  classe?: string;
  profId?: string;
  mois?: string;
}

export interface CahierTexteAdmin {
  id: string;
  date: string;
  classe: string;
  coursId: string;
  profId: string;
  profNom: string;
  contenu: string;
  devoirs: string;
  isSigned: boolean;
  signedAt: string | null;
  createdAt: string | null;
}

export function createUserSecure(params: CreateUserParams): Promise<CreateUserResult> {
  return callFunction("createUser", params);
}

export function deleteUserSecure(userId: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteUser", { userId });
}

export function createPaiementSecure(params: CreatePaiementParams): Promise<CreatePaiementResult> {
  return callFunction("createPaiement", params);
}

export function toggleUserStatusSecure(params: ToggleUserStatusParams): Promise<{ success: boolean; message: string }> {
  return callFunction("toggleUserStatus", params);
}

export function getAuditLogsSecure(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
  return callFunction("getAuditLogs", { limit });
}

export function getAllCahierEntriesSecure(): Promise<{ success: boolean; entries: CahierEntryAdmin[] }> {
  return callFunction("getAllCahierEntries", undefined);
}

export function getCahierTextesAdmin(params: GetCahierTextesAdminParams = {}): Promise<{ success: boolean; entries: CahierTexteAdmin[] }> {
  return callFunction("getCahierTextesAdmin", params);
}

export interface AdminDashboardStats {
  totalEleves: number;
  totalProfesseurs: number;
  totalClasses: number;
  totalPaiementsRecus: number;
  totalPaiementsAttendus: number;
  tauxCouverture: number;
  totalDepenses: number;
  totalSalaires: number;
}

export function getAdminDashboardStatsSecure(): Promise<{ success: boolean; stats: AdminDashboardStats }> {
  return callFunction("getAdminDashboardStats", undefined);
}

// Stats detaillees (remplace le fetch all client de Stats.tsx)
export interface EleveStatDetail {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  sexe: string;
  presences: number;
  absences: number;
  retards: number;
  tauxPresence: number;
  paiementTotal: number;
  paiementPaye: number;
  paiementStatut: "ok" | "partiel" | "impaye";
}

export interface DetailedStatsGlobal {
  totalEleves: number;
  elevesActifs: number;
  totalPresences: number;
  tauxPresenceMoyen: number;
  totalPaiements: number;
  totalPaye: number;
}

export interface DetailedStatsResult {
  success: boolean;
  global: DetailedStatsGlobal;
  classes: string[];
  eleves: EleveStatDetail[];
}

export function getDetailedStatsSecure(params: { classe?: string } = {}): Promise<DetailedStatsResult> {
  return callFunction("getDetailedStats", params);
}

// Presences batch
export interface MarquerPresenceBatchParams {
  coursId: string;
  date: string;
  classe: string;
  presences: Array<{
    eleveId: string;
    statut: "present" | "absent" | "retard" | "excuse";
    minutesRetard?: number;
  }>;
}

export function marquerPresenceBatchSecure(params: MarquerPresenceBatchParams): Promise<{ success: boolean }> {
  return callFunction("marquerPresenceBatch", params);
}

// Versements
export interface AjouterVersementParams {
  paiementId: string;
  montant: number;
  methode: "especes" | "mobile_money" | "virement" | "cheque";
  datePaiement: string;
}

export function ajouterVersementSecure(params: AjouterVersementParams): Promise<{ success: boolean; message: string }> {
  return callFunction("ajouterVersement", params);
}

// =====================
// Notes / Evaluations
// =====================

export interface CreateEvaluationParams {
  classe: string;
  matiere: string;
  titre: string;
  type: "devoir" | "examen" | "interro";
  date: string;
  trimestre: 1 | 2 | 3;
  coefficient: number;
  maxNote: number;
}

export interface UpdateEvaluationParams extends Partial<CreateEvaluationParams> {
  id: string;
}

export interface EvaluationResult {
  id: string;
  classe: string;
  matiere: string;
  titre: string;
  type: "devoir" | "examen" | "interro";
  date: string;
  trimestre: 1 | 2 | 3;
  coefficient: number;
  maxNote: number;
  professeurId: string;
  professeurNom: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GetEvaluationsParams {
  classe?: string;
  matiere?: string;
  trimestre?: number;
  professeurId?: string;
}

export function createEvaluationSecure(params: CreateEvaluationParams): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createEvaluation", params);
}

export function updateEvaluationSecure(params: UpdateEvaluationParams): Promise<{ success: boolean; message: string }> {
  return callFunction("updateEvaluation", params);
}

export function deleteEvaluationSecure(id: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteEvaluation", { id });
}

export function getEvaluationsByClasseSecure(params: GetEvaluationsParams = {}): Promise<{ success: boolean; evaluations: EvaluationResult[] }> {
  return callFunction("getEvaluationsByClasse", params);
}

// Notes
export interface NoteEntry {
  eleveId: string;
  eleveNom: string;
  note: number;
  commentaire?: string;
  absence?: boolean;
}

export interface CreateNoteParams extends NoteEntry {
  evaluationId: string;
}

export interface CreateNotesBatchParams {
  evaluationId: string;
  notes: NoteEntry[];
}

export interface NoteResult {
  id: string;
  evaluationId: string;
  eleveId: string;
  eleveNom: string;
  note: number;
  commentaire: string;
  absence: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  evaluation?: {
    titre: string;
    matiere: string;
    type: string;
    date: string;
    trimestre: number;
    coefficient: number;
    maxNote: number;
  };
}

export function createNoteSecure(params: CreateNoteParams): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createNote", params);
}

export function createNotesBatchSecure(params: CreateNotesBatchParams): Promise<{ success: boolean; message: string }> {
  return callFunction("createNotesBatch", params);
}

export function updateNoteSecure(params: { id: string; note?: number; commentaire?: string; absence?: boolean }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateNote", params);
}

export function deleteNoteSecure(id: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteNote", { id });
}

export function getNotesByEvaluationSecure(evaluationId: string): Promise<{ success: boolean; notes: NoteResult[] }> {
  return callFunction("getNotesByEvaluation", { evaluationId });
}

export function getNotesByEleveSecure(params: { eleveId: string; trimestre?: number }): Promise<{ success: boolean; notes: NoteResult[] }> {
  return callFunction("getNotesByEleve", params);
}

// Moyennes
export interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  totalCoef: number;
  notes: Array<{
    titre: string;
    note: number;
    maxNote: number;
    coefficient: number;
    type: string;
    absence: boolean;
  }>;
}

export function calculateMoyennesSecure(params: { eleveId: string; trimestre: number }): Promise<{ success: boolean; moyennes: MoyenneMatiere[]; moyenneGenerale: number }> {
  return callFunction("calculateMoyennes", params);
}

// Bulletins
export interface BulletinResult {
  id?: string;
  eleveId: string;
  classe: string;
  trimestre: number;
  anneeScolaire: string;
  moyennesMatiere: Record<string, number>;
  moyenneGenerale: number;
  rang: number;
  totalEleves: number;
  absencesTotal: number;
  retardsTotal: number;
  appreciationGenerale: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function generateBulletinSecure(params: {
  eleveId: string;
  classe: string;
  trimestre: number;
  anneeScolaire: string;
  appreciationGenerale?: string;
}): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("generateBulletin", params);
}

export function generateBulletinsClasseSecure(params: {
  classe: string;
  trimestre: number;
  anneeScolaire: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  return callFunction("generateBulletinsClasse", params);
}

// =====================
// Bulletin Versions
// =====================

export interface BulletinVersion {
  id: string;
  data: BulletinResult;
  versionNumber: number;
  createdAt: string | null;
  createdBy: string;
}

export function getBulletinVersionsSecure(bulletinId: string): Promise<{ success: boolean; versions: BulletinVersion[] }> {
  return callFunction("getBulletinVersions", { bulletinId });
}

export interface VersionDiff {
  matiere: string;
  noteA: number | null;
  noteB: number | null;
  change: number | null;
}

export function compareBulletinVersionsSecure(bulletinId: string, versionA: string, versionB: string): Promise<{ success: boolean; diff: VersionDiff[]; moyenneA: number | null; moyenneB: number | null }> {
  return callFunction("compareBulletinVersions", { bulletinId, versionA, versionB });
}

// =====================
// Advanced Stats
// =====================

export interface AdvancedStatsResult {
  success: boolean;
  months: string[];
  presencesByMonth: Record<string, { present: number; absent: number; retard: number }>;
  paiementsByMonth: Record<string, { total: number; paye: number }>;
  inscriptionsByMonth: Record<string, number>;
}

export function getAdvancedStatsSecure(): Promise<AdvancedStatsResult> {
  return callFunction("getAdvancedStats", undefined);
}

export interface ClasseComparisonItem {
  classe: string;
  totalEleves: number;
  tauxPresence: number;
  moyenneNotes: number;
  tauxPaiement: number;
}

export function getClasseComparisonSecure(): Promise<{ success: boolean; classes: ClasseComparisonItem[] }> {
  return callFunction("getClasseComparison", undefined);
}

// =====================
// Exports Excel
// =====================

export interface ExcelExportResult {
  success: boolean;
  data: string; // base64
  filename: string;
}

export function exportElevesExcelSecure(params: { classe?: string } = {}): Promise<ExcelExportResult> {
  return callFunction("exportElevesExcel", params);
}

export function exportPresencesExcelSecure(params: { classe?: string; mois?: string } = {}): Promise<ExcelExportResult> {
  return callFunction("exportPresencesExcel", params);
}

export function exportNotesExcelSecure(params: { classe?: string; trimestre?: number } = {}): Promise<ExcelExportResult> {
  return callFunction("exportNotesExcel", params);
}

export function exportPaiementsExcelSecure(params: { mois?: string } = {}): Promise<ExcelExportResult> {
  return callFunction("exportPaiementsExcel", params);
}

// =====================
// Notifications
// =====================

export interface NotificationPayload {
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  type: string;
  recipientId: string;
  channel: string;
  status: string;
  payload: NotificationPayload;
  senderId: string;
  createdAt: string | null;
  readAt: string | null;
}

export function sendNotificationSecure(params: {
  type: string;
  recipientId: string;
  channel: string;
  title: string;
  message: string;
  context?: Record<string, unknown>;
}): Promise<{ success: boolean; id: string }> {
  return callFunction("sendNotification", params);
}

export function getNotificationsSecure(limit = 50): Promise<{ success: boolean; notifications: NotificationItem[]; unreadCount: number }> {
  return callFunction("getNotifications", { limit });
}

export function markNotificationReadSecure(id: string): Promise<{ success: boolean }> {
  return callFunction("markNotificationRead", { id });
}

export function getNotificationConfigSecure(): Promise<{ success: boolean; config: Record<string, unknown> }> {
  return callFunction("getNotificationConfig", undefined);
}

export function updateNotificationConfigSecure(config: Record<string, unknown>): Promise<{ success: boolean }> {
  return callFunction("updateNotificationConfig", config);
}

export function sendBulkNotificationSecure(params: {
  title: string;
  message: string;
  targetType: "all" | "classe" | "role";
  targetValue?: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  return callFunction("sendBulkNotification", params);
}

// =====================
// Emploi du temps
// =====================

export interface CreneauData {
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  professeurId: string;
  professeurNom: string;
  classe: string;
  salle?: string;
}

export interface ScheduleConflict {
  type: "prof" | "classe";
  jour: string;
  heureDebut: string;
  heureFin: string;
  details: string;
  creneauIds: string[];
}

export function createCreneauBatchSecure(creneaux: CreneauData[]): Promise<{ success: boolean; message: string }> {
  return callFunction("createCreneauBatch", { creneaux });
}

export function checkScheduleConflictsSecure(): Promise<{ success: boolean; conflicts: ScheduleConflict[] }> {
  return callFunction("checkScheduleConflicts", undefined);
}

export function getEmploiDuTempsClasseSecure(classe: string): Promise<{ success: boolean; creneaux: (CreneauData & { id: string })[] }> {
  return callFunction("getEmploiDuTempsClasse", { classe });
}

export function getEmploiDuTempsProfSecure(professeurId: string): Promise<{ success: boolean; creneaux: (CreneauData & { id: string })[] }> {
  return callFunction("getEmploiDuTempsProf", { professeurId });
}

// =====================
// Discipline
// =====================

export interface DisciplineRecordResult {
  id: string;
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  type: string;
  description: string;
  motif: string;
  sanction: string;
  profId: string;
  profNom: string;
  isSystem: boolean;
  coursId?: string;
  coursDate?: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateDisciplineParams {
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  type: string;
  description: string;
  motif?: string;
  sanction?: string;
  coursId?: string;
  coursDate?: string;
}

export function createDisciplineRecordSecure(params: CreateDisciplineParams): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createDisciplineRecord", params);
}

export function getDisciplineRecordsSecure(params: { classe?: string; eleveId?: string; type?: string; limit?: number } = {}): Promise<{ success: boolean; records: DisciplineRecordResult[] }> {
  return callFunction("getDisciplineRecords", params);
}

export function updateDisciplineRecordSecure(params: { id: string; type?: string; description?: string; motif?: string; sanction?: string }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateDisciplineRecord", params);
}

export function deleteDisciplineRecordSecure(id: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteDisciplineRecord", { id });
}

// =====================
// Matieres
// =====================

export interface MatiereResult {
  id: string;
  nom: string;
  coefficient: number;
  couleur: string;
  createdAt: string | null;
}

export function getMatieresSecure(): Promise<{ success: boolean; matieres: MatiereResult[] }> {
  return callFunction("getMatieres", undefined);
}

export function createMatiereSecure(params: { nom: string; coefficient?: number; couleur?: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createMatiere", params);
}

export function updateMatiereSecure(params: { id: string; nom?: string; coefficient?: number; couleur?: string }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateMatiere", params);
}

export function deleteMatiereSecure(id: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteMatiere", { id });
}

// =====================
// CSV Import
// =====================

export interface EleveImportRow {
  nom: string;
  prenom: string;
  classe: string;
  sexe?: string;
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
}

export interface ImportResult {
  success: boolean;
  dryRun: boolean;
  totalRows?: number;
  validRows?: number;
  imported?: number;
  errors: Array<{ row: number; message: string }>;
  message?: string;
}

export function importElevesCsvSecure(params: { rows: EleveImportRow[]; dryRun?: boolean }): Promise<ImportResult> {
  return callFunction("importElevesCsv", params);
}

// =====================
// At-Risk Students
// =====================

export interface AtRiskStudent {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  risks: Array<{
    type: "absence" | "payment" | "grades";
    severity: "warning" | "danger";
    detail: string;
  }>;
}

export function getAtRiskStudentsSecure(): Promise<{ success: boolean; students: AtRiskStudent[] }> {
  return callFunction("getAtRiskStudents", undefined);
}

// =====================
// Creneau Update
// =====================

export interface UpdateCreneauParams {
  id: string;
  jour?: string;
  heureDebut?: string;
  heureFin?: string;
  matiere?: string;
  professeurId?: string;
  professeurNom?: string;
  classe?: string;
  salle?: string;
}

export function updateCreneauSecure(params: UpdateCreneauParams): Promise<{ success: boolean; conflicts?: string[]; message: string }> {
  return callFunction("updateCreneau", params);
}

// =====================
// Class Promotion
// =====================

export interface PromoteClasseParams {
  sourceClasse: string;
  targetClasse: string;
  anneeScolaire: string;
}

export function promoteClasseSecure(params: PromoteClasseParams): Promise<{ success: boolean; count: number; message: string }> {
  return callFunction("promoteClasse", params);
}

// =====================
// Archive
// =====================

export interface ArchiveParams {
  anneeScolaire: string;
  deleteOriginals?: boolean;
}

export function archiveAnneeScolaireSecure(params: ArchiveParams): Promise<{ success: boolean; stats: Record<string, number>; message: string }> {
  return callFunction("archiveAnneeScolaire", params);
}

// =====================
// Analytics Reports
// =====================

export type AnalyticsReportType = "attendance" | "grades" | "payments" | "comprehensive";

export interface AnalyticsReportParams {
  type: AnalyticsReportType;
  dateStart?: string;
  dateEnd?: string;
  classe?: string;
  matiere?: string;
}

export interface AnalyticsAttendance {
  totalPresences: number;
  totalAbsences: number;
  totalRetards: number;
  tauxPresence: number;
  byClasse: Record<string, { present: number; absent: number; retard: number; taux: number }>;
}

export interface AnalyticsGrades {
  moyenneGenerale: number;
  tauxReussite: number;
  byMatiere: Record<string, { moyenne: number; min: number; max: number; totalNotes: number; tauxReussite: number }>;
}

export interface AnalyticsPayments {
  totalAttendu: number;
  totalPaye: number;
  tauxRecouvrement: number;
  impayes: number;
}

export interface AnalyticsCorrelation {
  classe: string;
  tauxPresence: number;
  moyenneNotes: number;
}

export interface AnalyticsReport {
  type: AnalyticsReportType;
  attendance?: AnalyticsAttendance;
  grades?: AnalyticsGrades;
  payments?: AnalyticsPayments;
  correlations?: AnalyticsCorrelation[];
}

export function getAnalyticsReportSecure(params: AnalyticsReportParams): Promise<{ success: boolean; report: AnalyticsReport }> {
  return callFunction("getAnalyticsReport", params);
}

// =====================
// Permissions
// =====================

export function getUserPermissionsSecure(userId: string): Promise<{ success: boolean; permissions: string[]; role: string }> {
  return callFunction("getUserPermissions", { userId });
}

export function updateUserPermissionsSecure(userId: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
  return callFunction("updateUserPermissions", { userId, permissions });
}

// =====================
// Schools (SaaS)
// =====================

export function createSchoolSecure(params: {
  schoolName: string; adminEmail: string; adminPassword: string;
  adminNom?: string; adminPrenom?: string; adresse?: string; telephone?: string;
}): Promise<{ success: boolean; schoolId: string; message: string }> {
  return callFunction("createSchool", params);
}

export function updateSchoolSecure(params: { schoolId?: string; updates: Record<string, unknown> }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateSchool", params);
}

// =====================
// Billing
// =====================

export function createCheckoutSessionSecure(params: { priceId: string }): Promise<{ success: boolean; url: string }> {
  return callFunction("createCheckoutSession", params);
}

export function createCustomerPortalSecure(): Promise<{ success: boolean; url: string }> {
  return callFunction("createCustomerPortal", undefined);
}

// =====================
// Admissions
// =====================

export function listAdmissionsSecure(params: { statut?: string } = {}): Promise<{ success: boolean; admissions: unknown[] }> {
  return callFunction("listAdmissions", params);
}

export function updateAdmissionSecure(params: { id: string; statut: string; rejectReason?: string }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateAdmission", params);
}

// =====================
// Transport
// =====================

export function createRouteSecure(params: { nom: string; arrets?: string[]; chauffeur?: string; telephone?: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createRoute", params);
}

export function listRoutesSecure(): Promise<{ success: boolean; routes: unknown[] }> {
  return callFunction("listRoutes", undefined);
}

export function deleteRouteSecure(id: string): Promise<{ success: boolean; message: string }> {
  return callFunction("deleteRoute", { id });
}

// =====================
// Library
// =====================

export function createBookSecure(params: { titre: string; auteur: string; isbn?: string; quantite?: number; categorie?: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createBook", params);
}

export function listBooksSecure(): Promise<{ success: boolean; books: unknown[] }> {
  return callFunction("listBooks", undefined);
}

export function borrowBookSecure(params: { bookId: string; eleveId: string; eleveNom: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("borrowBook", params);
}

export function returnBookSecure(empruntId: string): Promise<{ success: boolean; message: string }> {
  return callFunction("returnBook", { empruntId });
}

// =====================
// HR / Leave
// =====================

export function createLeaveRequestSecure(params: { type: string; dateDebut: string; dateFin: string; motif?: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createLeaveRequest", params);
}

export function listLeaveRequestsSecure(params: { all?: boolean } = {}): Promise<{ success: boolean; requests: unknown[] }> {
  return callFunction("listLeaveRequests", params);
}

export function updateLeaveRequestSecure(params: { id: string; statut: string; commentaire?: string }): Promise<{ success: boolean; message: string }> {
  return callFunction("updateLeaveRequest", params);
}

// =====================
// LMS
// =====================

export function createAssignmentSecure(params: {
  titre: string; description?: string; classe: string; matiere: string; dateLimite: string; fichierUrl?: string;
}): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("createAssignment", params);
}

export function listAssignmentsSecure(params: { classe?: string; matiere?: string } = {}): Promise<{ success: boolean; assignments: unknown[] }> {
  return callFunction("listAssignments", params);
}

export function submitAssignmentSecure(params: { assignmentId: string; fichierUrl?: string; contenu?: string }): Promise<{ success: boolean; id: string; message: string }> {
  return callFunction("submitAssignment", params);
}

export function gradeSubmissionSecure(params: { submissionId: string; note: number; commentaire?: string }): Promise<{ success: boolean; message: string }> {
  return callFunction("gradeSubmission", params);
}

// Re-export callFunction for direct use
export { callFunction };

export function getCloudFunctionErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes("NOT_AUTHENTICATED") || msg.includes("unauthenticated")) {
      return "Vous devez etre connecte pour effectuer cette action.";
    }
    if (msg.includes("permission-denied")) return "Vous n'avez pas les droits necessaires.";
    if (msg.includes("already-exists")) return "Cet element existe deja.";
    if (msg.includes("not-found")) return "Element non trouve.";
    if (msg.includes("invalid-argument")) return msg.replace("invalid-argument: ", "");
    return msg;
  }
  return "Une erreur inattendue s'est produite.";
}
