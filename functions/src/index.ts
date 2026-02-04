import * as functions from "firebase-functions";
import { db, admin } from "./firebase";

// Export scheduled reports
export {
  sendMonthlyPaymentReport,
  sendPaymentReportManual,
  configureReportEmail,
} from "./scheduled.reports";

// ========================================
// TYPES
// ========================================

interface CreateUserData {
  email: string;
  password: string;
  role: "admin" | "gestionnaire" | "prof" | "eleve" | "parent";
  nom?: string;
  prenom?: string;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
}

interface CreatePaiementData {
  eleveId: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  datePaiement: string;
}

// ========================================
// HELPERS
// ========================================

async function verifyAdmin(uid: string): Promise<boolean> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return data?.role === "admin";
}

async function verifyAdminOrGestionnaire(uid: string): Promise<boolean> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return data?.role === "admin" || data?.role === "gestionnaire";
}

// ========================================
// CLOUD FUNCTIONS
// ========================================

/**
 * Creer un utilisateur - ADMIN UNIQUEMENT
 * Securise la creation d'utilisateurs cote serveur
 */
export const createUser = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    // Verifier l'authentification
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte pour effectuer cette action."
      );
    }

    // Verifier les droits admin
    const isAdmin = await verifyAdmin(auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent creer des utilisateurs."
      );
    }

    const userData = data as CreateUserData;

    // Validation des donnees
    if (!userData.email || !userData.password || !userData.role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, mot de passe et role sont requis."
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format d'email invalide."
      );
    }

    // Validation mot de passe (min 6 caracteres)
    if (userData.password.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le mot de passe doit contenir au moins 6 caracteres."
      );
    }

    // Validation role
    const validRoles = ["admin", "gestionnaire", "prof", "eleve", "parent"];
    if (!validRoles.includes(userData.role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Role invalide."
      );
    }

    try {
      // Creer l'utilisateur Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.prenom && userData.nom
          ? `${userData.prenom} ${userData.nom}`
          : undefined,
      });

      // Creer le document Firestore
      await db.collection("users").doc(userRecord.uid).set({
        email: userData.email,
        role: userData.role,
        isActive: true,
        nom: userData.nom || null,
        prenom: userData.prenom || null,
        eleveId: userData.eleveId || null,
        professeurId: userData.professeurId || null,
        enfantsIds: userData.enfantsIds || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.uid,
      });

      // Log de l'action
      await db.collection("audit_logs").add({
        action: "USER_CREATED",
        targetUserId: userRecord.uid,
        targetEmail: userData.email,
        targetRole: userData.role,
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        uid: userRecord.uid,
        message: "Utilisateur cree avec succes.",
      };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError(
          "already-exists",
          "Cet email est deja utilise."
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la creation de l'utilisateur."
      );
    }
  });

/**
 * Supprimer un utilisateur - ADMIN UNIQUEMENT
 */
export const deleteUser = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent supprimer des utilisateurs."
      );
    }

    const { userId } = data as { userId: string };

    if (!userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID utilisateur requis."
      );
    }

    // Empecher l'auto-suppression
    if (userId === auth.uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Vous ne pouvez pas supprimer votre propre compte."
      );
    }

    try {
      // Recuperer les infos avant suppression pour l'audit
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      // Supprimer de Firebase Auth
      await admin.auth().deleteUser(userId);

      // Supprimer de Firestore
      await db.collection("users").doc(userId).delete();

      // Log de l'action
      await db.collection("audit_logs").add({
        action: "USER_DELETED",
        targetUserId: userId,
        targetEmail: userData?.email,
        targetRole: userData?.role,
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Utilisateur supprime." };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la suppression."
      );
    }
  });

/**
 * Creer un paiement - ADMIN/GESTIONNAIRE avec validation
 */
export const createPaiement = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAuthorized = await verifyAdminOrGestionnaire(auth.uid);
    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Vous n'avez pas les droits pour creer un paiement."
      );
    }

    const paiementData = data as CreatePaiementData;

    // Validations
    if (!paiementData.eleveId || !paiementData.mois) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Eleve et mois sont requis."
      );
    }

    // Validation datePaiement obligatoire
    if (!paiementData.datePaiement) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La date de paiement est requise."
      );
    }

    // Validation format datePaiement (YYYY-MM-DD)
    const datePaiementRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePaiementRegex.test(paiementData.datePaiement)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de date de paiement invalide (attendu: YYYY-MM-DD)."
      );
    }

    // Validation que la date est valide
    const datePaiementParsed = new Date(paiementData.datePaiement);
    if (isNaN(datePaiementParsed.getTime())) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Date de paiement invalide."
      );
    }

    // Validation format mois (YYYY-MM)
    const moisRegex = /^\d{4}-\d{2}$/;
    if (!moisRegex.test(paiementData.mois)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de mois invalide (attendu: YYYY-MM)."
      );
    }

    // Validation montants
    if (paiementData.montantTotal < 0 || paiementData.montantPaye < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Les montants ne peuvent pas etre negatifs."
      );
    }

    if (paiementData.montantPaye > paiementData.montantTotal) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le montant paye ne peut pas depasser le montant total."
      );
    }

    // Verifier que l'eleve existe
    const eleveDoc = await db.collection("eleves").doc(paiementData.eleveId).get();
    if (!eleveDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Eleve non trouve."
      );
    }

    const eleveData = eleveDoc.data();

    // Verifier doublon (meme eleve, meme mois)
    const existingPaiement = await db.collection("paiements")
      .where("eleveId", "==", paiementData.eleveId)
      .where("mois", "==", paiementData.mois)
      .get();

    if (!existingPaiement.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Un paiement existe deja pour cet eleve ce mois."
      );
    }

    const montantRestant = paiementData.montantTotal - paiementData.montantPaye;
    let statut: "paye" | "partiel" | "impaye" = "impaye";
    if (montantRestant === 0) statut = "paye";
    else if (paiementData.montantPaye > 0) statut = "partiel";

    try {
      const paiementRef = await db.collection("paiements").add({
        eleveId: paiementData.eleveId,
        eleveNom: `${eleveData?.prenom || ""} ${eleveData?.nom || ""}`.trim(),
        mois: paiementData.mois,
        montantTotal: paiementData.montantTotal,
        montantPaye: paiementData.montantPaye,
        montantRestant,
        statut,
        datePaiement: admin.firestore.Timestamp.fromDate(datePaiementParsed),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.uid,
      });

      // Log de l'action
      await db.collection("audit_logs").add({
        action: "PAIEMENT_CREATED",
        paiementId: paiementRef.id,
        eleveId: paiementData.eleveId,
        montant: paiementData.montantTotal,
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        id: paiementRef.id,
        message: "Paiement cree avec succes.",
      };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la creation du paiement."
      );
    }
  });

/**
 * Desactiver un utilisateur - ADMIN UNIQUEMENT
 */
export const toggleUserStatus = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent modifier le statut des utilisateurs."
      );
    }

    const { userId, isActive } = data as { userId: string; isActive: boolean };

    if (!userId || typeof isActive !== "boolean") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Parametres invalides."
      );
    }

    // Empecher l'auto-desactivation
    if (userId === auth.uid && !isActive) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Vous ne pouvez pas desactiver votre propre compte."
      );
    }

    try {
      await db.collection("users").doc(userId).update({
        isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      });

      // Desactiver aussi dans Firebase Auth
      await admin.auth().updateUser(userId, { disabled: !isActive });

      // Log
      await db.collection("audit_logs").add({
        action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        targetUserId: userId,
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: isActive ? "Utilisateur active." : "Utilisateur desactive.",
      };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la modification du statut."
      );
    }
  });



/**
 * Obtenir les logs d'audit - ADMIN UNIQUEMENT
 */
export const getAuditLogs = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent voir les logs d'audit."
      );
    }

    const { limit: queryLimit = 100 } = data as { limit?: number };
    const safeLimit = Math.min(queryLimit, 500); // Max 500 logs

    try {
      const logsSnapshot = await db.collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(safeLimit)
        .get();

      const logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, logs };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la recuperation des logs."
      );
    }
  });
