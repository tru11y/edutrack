import * as functions from "firebase-functions";
import { db, admin } from "./firebase";

// ========================================
// TYPES
// ========================================

interface MarquerPresenceData {
  coursId: string;
  eleveId: string;
  statut: "present" | "absent" | "retard" | "excuse";
  minutesRetard?: number;
  commentaire?: string;
}

// ========================================
// CLOUD FUNCTION
// ========================================

/**
 * Marquer la présence d'un élève
 * PROF uniquement
 */
export const marquerPresence = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    // 1. Authentification
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }

    // 2. Vérifier rôle prof
    const userDoc = await db.collection("users").doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "prof") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les professeurs peuvent marquer les présences."
      );
    }

    const presenceData = data as MarquerPresenceData;

    // 3. Validation des données
    if (!presenceData.coursId || !presenceData.eleveId || !presenceData.statut) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "coursId, eleveId et statut sont requis."
      );
    }

    const validStatuts = ["present", "absent", "retard", "excuse"];
    if (!validStatuts.includes(presenceData.statut)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Statut invalide."
      );
    }

    // 4. Récupérer le cours
    const coursDoc = await db.collection("cours").doc(presenceData.coursId).get();
    if (!coursDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Cours non trouvé.");
    }

    const coursData = coursDoc.data()!;

    // 5. Autorisation : professeurId === auth.uid OU type === "exceptionnel"
    const estAutorise =
      coursData.professeurId === auth.uid ||
      coursData.type === "exceptionnel";

    if (!estAutorise) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Vous n'êtes pas autorisé à modifier ce cours."
      );
    }

    // 6. Vérification heureDebut et heureFin sont des Timestamp
    if (
      !(coursData.heureDebut instanceof admin.firestore.Timestamp) ||
      !(coursData.heureFin instanceof admin.firestore.Timestamp)
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "heureDebut et heureFin doivent être des Firestore Timestamp."
      );
    }

    const now = admin.firestore.Timestamp.now();
    if (
      now.toMillis() < coursData.heureDebut.toMillis() ||
      now.toMillis() > coursData.heureFin.toMillis()
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "La présence ne peut être marquée que pendant le cours."
      );
    }

    // 7. Vérifier élève et classe
    const eleveDoc = await db.collection("eleves").doc(presenceData.eleveId).get();
    if (!eleveDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Élève non trouvé.");
    }

    const eleveData = eleveDoc.data()!;
    const eleveClasse = eleveData.classe || eleveData.classeId;
    const coursClasse = coursData.classe || coursData.classeId;

    if (eleveClasse !== coursClasse) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "L'élève n'appartient pas à la classe de ce cours."
      );
    }

    // 8. Transaction Firestore avec audit log
    const presenceRef = db
      .collection("presences")
      .doc(presenceData.coursId)
      .collection("appels")
      .doc(presenceData.eleveId);

    const auditRef = db.collection("audit_logs").doc();

    await db.runTransaction(async (transaction) => {
      transaction.set(
        presenceRef,
        {
          eleveId: presenceData.eleveId,
          eleveNom: `${eleveData.prenom || ""} ${eleveData.nom || ""}`.trim(),
          statut: presenceData.statut,
          minutesRetard:
            presenceData.statut === "retard"
              ? presenceData.minutesRetard || 0
              : null,
          commentaire: presenceData.commentaire || null,
          coursId: presenceData.coursId,
          classe: coursClasse,
          marqueePar: auth.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.set(auditRef, {
        action: "PRESENCE_MARQUEE",
        coursId: presenceData.coursId,
        eleveId: presenceData.eleveId,
        statut: presenceData.statut,
        classe: coursClasse,
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  });
