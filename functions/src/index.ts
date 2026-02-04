import * as functions from "firebase-functions";
import { db, admin } from "./firebase";

export {
  sendMonthlyPaymentReport,
  sendPaymentReportManual,
  configureReportEmail,
} from "./scheduled.reports";

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

export const createUser = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateUserData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte pour effectuer cette action."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent creer des utilisateurs."
      );
    }

    if (!data.email || !data.password || !data.role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, mot de passe et role sont requis."
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format d'email invalide."
      );
    }

    if (data.password.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le mot de passe doit contenir au moins 6 caracteres."
      );
    }

    const validRoles = ["admin", "gestionnaire", "prof", "eleve", "parent"];
    if (!validRoles.includes(data.role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Role invalide."
      );
    }

    try {
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.prenom && data.nom
          ? `${data.prenom} ${data.nom}`
          : undefined,
      });

      await db.collection("users").doc(userRecord.uid).set({
        email: data.email,
        role: data.role,
        isActive: true,
        nom: data.nom || null,
        prenom: data.prenom || null,
        eleveId: data.eleveId || null,
        professeurId: data.professeurId || null,
        enfantsIds: data.enfantsIds || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      });

      await db.collection("audit_logs").add({
        action: "USER_CREATED",
        targetUserId: userRecord.uid,
        targetEmail: data.email,
        targetRole: data.role,
        performedBy: context.auth.uid,
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

export const deleteUser = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent supprimer des utilisateurs."
      );
    }

    if (!data.userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID utilisateur requis."
      );
    }

    if (data.userId === context.auth.uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Vous ne pouvez pas supprimer votre propre compte."
      );
    }

    try {
      const userDoc = await db.collection("users").doc(data.userId).get();
      const userData = userDoc.data();

      await admin.auth().deleteUser(data.userId);
      await db.collection("users").doc(data.userId).delete();

      await db.collection("audit_logs").add({
        action: "USER_DELETED",
        targetUserId: data.userId,
        targetEmail: userData?.email,
        targetRole: userData?.role,
        performedBy: context.auth.uid,
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

export const createPaiement = functions
  .region("europe-west1")
  .https.onCall(async (data: CreatePaiementData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAuthorized = await verifyAdminOrGestionnaire(context.auth.uid);
    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Vous n'avez pas les droits pour creer un paiement."
      );
    }

    if (!data.eleveId || !data.mois) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Eleve et mois sont requis."
      );
    }

    if (!data.datePaiement) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La date de paiement est requise."
      );
    }

    const datePaiementRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePaiementRegex.test(data.datePaiement)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de date de paiement invalide (attendu: YYYY-MM-DD)."
      );
    }

    const datePaiementParsed = new Date(data.datePaiement);
    if (isNaN(datePaiementParsed.getTime())) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Date de paiement invalide."
      );
    }

    const moisRegex = /^\d{4}-\d{2}$/;
    if (!moisRegex.test(data.mois)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de mois invalide (attendu: YYYY-MM)."
      );
    }

    if (data.montantTotal < 0 || data.montantPaye < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Les montants ne peuvent pas etre negatifs."
      );
    }

    if (data.montantPaye > data.montantTotal) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le montant paye ne peut pas depasser le montant total."
      );
    }

    const eleveDoc = await db.collection("eleves").doc(data.eleveId).get();
    if (!eleveDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Eleve non trouve."
      );
    }

    const eleveData = eleveDoc.data();

    const existingPaiement = await db.collection("paiements")
      .where("eleveId", "==", data.eleveId)
      .where("mois", "==", data.mois)
      .get();

    if (!existingPaiement.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Un paiement existe deja pour cet eleve ce mois."
      );
    }

    const montantRestant = data.montantTotal - data.montantPaye;
    let statut: "paye" | "partiel" | "impaye" = "impaye";
    if (montantRestant === 0) statut = "paye";
    else if (data.montantPaye > 0) statut = "partiel";

    try {
      const paiementRef = await db.collection("paiements").add({
        eleveId: data.eleveId,
        eleveNom: `${eleveData?.prenom || ""} ${eleveData?.nom || ""}`.trim(),
        mois: data.mois,
        montantTotal: data.montantTotal,
        montantPaye: data.montantPaye,
        montantRestant,
        statut,
        datePaiement: admin.firestore.Timestamp.fromDate(datePaiementParsed),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      });

      await db.collection("audit_logs").add({
        action: "PAIEMENT_CREATED",
        paiementId: paiementRef.id,
        eleveId: data.eleveId,
        montant: data.montantTotal,
        performedBy: context.auth.uid,
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

export const toggleUserStatus = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string; isActive: boolean }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent modifier le statut des utilisateurs."
      );
    }

    if (!data.userId || typeof data.isActive !== "boolean") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Parametres invalides."
      );
    }

    if (data.userId === context.auth.uid && !data.isActive) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Vous ne pouvez pas desactiver votre propre compte."
      );
    }

    try {
      await db.collection("users").doc(data.userId).update({
        isActive: data.isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid,
      });

      await admin.auth().updateUser(data.userId, { disabled: !data.isActive });

      await db.collection("audit_logs").add({
        action: data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        targetUserId: data.userId,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: data.isActive ? "Utilisateur active." : "Utilisateur desactive.",
      };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la modification du statut."
      );
    }
  });

export const getAuditLogs = functions
  .region("europe-west1")
  .https.onCall(async (data: { limit?: number }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent voir les logs d'audit."
      );
    }

    const queryLimit = data?.limit || 100;
    const safeLimit = Math.min(queryLimit, 500);

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

export const getAllCahierEntries = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent acceder au cahier de texte complet."
      );
    }

    try {
      const [cahierSnap, elevesSnap] = await Promise.all([
        db.collection("cahier").orderBy("date", "desc").get(),
        db.collection("eleves").get(),
      ]);

      const elevesMap = new Map<string, { nom: string; prenom: string; classe: string }>();
      elevesSnap.docs.forEach((doc) => {
        const d = doc.data();
        elevesMap.set(doc.id, {
          nom: d.nom || "",
          prenom: d.prenom || "",
          classe: d.classe || "",
        });
      });

      const entries = cahierSnap.docs.map((doc) => {
        const d = doc.data();
        const elevesDetails = (d.eleves || []).map((eleveId: string) => {
          const eleve = elevesMap.get(eleveId);
          return {
            id: eleveId,
            nom: eleve?.nom || "",
            prenom: eleve?.prenom || "",
            nomComplet: eleve ? `${eleve.prenom} ${eleve.nom}`.trim() : eleveId,
          };
        });

        return {
          id: doc.id,
          date: d.date || "",
          classe: d.classe || "",
          coursId: d.coursId || "",
          profId: d.profId || "",
          profNom: d.profNom || "",
          contenu: d.contenu || "",
          devoirs: d.devoirs || "",
          isSigned: d.isSigned || false,
          signedAt: d.signedAt?.toDate?.()?.toISOString() || null,
          eleves: d.eleves || [],
          elevesDetails,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, entries };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la recuperation du cahier de texte."
      );
    }
  });

interface GetCahierTextesAdminParams {
  classe?: string;
  profId?: string;
  mois?: string;
}

export const getCahierTextesAdmin = functions
  .region("europe-west1")
  .https.onCall(async (data: GetCahierTextesAdminParams, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent acceder aux cahiers de texte."
      );
    }

    try {
      let cahierQuery: FirebaseFirestore.Query = db.collection("cahier");

      if (data?.classe) {
        cahierQuery = cahierQuery.where("classe", "==", data.classe);
      }

      if (data?.profId) {
        cahierQuery = cahierQuery.where("profId", "==", data.profId);
      }

      cahierQuery = cahierQuery.orderBy("date", "desc").limit(50);

      const cahierSnap = await cahierQuery.get();

      let docs = cahierSnap.docs;
      if (data?.mois) {
        docs = docs.filter((doc) => {
          const date = doc.data().date as string;
          return date && date.startsWith(data.mois!);
        });
      }

      const profsSnap = await db.collection("professeurs").get();
      const profsMap = new Map<string, { nom: string; prenom: string }>();
      profsSnap.docs.forEach((doc) => {
        const d = doc.data();
        profsMap.set(doc.id, {
          nom: d.nom || "",
          prenom: d.prenom || "",
        });
      });

      const entries = docs.map((doc) => {
        const d = doc.data();
        const prof = profsMap.get(d.profId);
        const profNomComplet = prof
          ? `${prof.prenom} ${prof.nom}`.trim()
          : d.profNom || d.profId || "";

        return {
          id: doc.id,
          date: d.date || "",
          classe: d.classe || "",
          coursId: d.coursId || "",
          profId: d.profId || "",
          profNom: profNomComplet,
          contenu: d.contenu || "",
          devoirs: d.devoirs || "",
          isSigned: d.isSigned || false,
          signedAt: d.signedAt?.toDate?.()?.toISOString() || null,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, entries };
    } catch (error) {
      console.error("getCahierTextesAdmin error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la recuperation des cahiers de texte."
      );
    }
  });
