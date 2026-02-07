import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyProf } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { VALID_PRESENCE_STATUTS } from "../../helpers/validation";

interface PresenceEntry {
  eleveId: string;
  statut: "present" | "absent" | "retard" | "excuse";
  minutesRetard?: number;
}

interface MarquerPresenceBatchData {
  coursId: string;
  date: string;
  classe: string;
  presences: PresenceEntry[];
}

export const marquerPresenceBatch = functions
  .region("europe-west1")
  .https.onCall(async (data: MarquerPresenceBatchData, context) => {
    requireAuth(context.auth?.uid);
    const isProf = await verifyProf(context.auth!.uid);
    requirePermission(isProf, "Seuls les professeurs peuvent marquer les presences.");

    requireArgument(
      !!data.coursId && !!data.date && !!data.classe,
      "coursId, date et classe sont requis."
    );
    requireArgument(
      Array.isArray(data.presences) && data.presences.length > 0,
      "Le tableau presences est requis et ne peut pas etre vide."
    );

    for (const entry of data.presences) {
      requireArgument(!!entry.eleveId, "eleveId est requis pour chaque presence.");
      requireArgument(
        VALID_PRESENCE_STATUTS.includes(entry.statut),
        `Statut invalide pour l'eleve ${entry.eleveId}: ${entry.statut}`
      );
    }

    const coursDoc = await db.collection("cours").doc(data.coursId).get();
    if (!coursDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Cours non trouve.");
    }

    const coursData = coursDoc.data()!;
    const estAutorise =
      coursData.professeurId === context.auth!.uid ||
      coursData.type === "exceptionnel";

    requirePermission(estAutorise, "Vous n'etes pas autorise a modifier ce cours.");

    const batch = db.batch();

    for (const entry of data.presences) {
      const presenceRef = db
        .collection("presences")
        .doc(data.coursId)
        .collection("appels")
        .doc(entry.eleveId);

      batch.set(
        presenceRef,
        {
          eleveId: entry.eleveId,
          statut: entry.statut,
          minutesRetard: entry.statut === "retard" ? entry.minutesRetard || 0 : null,
          coursId: data.coursId,
          classe: data.classe,
          date: data.date,
          marqueePar: context.auth!.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const auditRef = db.collection("audit_logs").doc();
    batch.set(auditRef, {
      action: "PRESENCE_BATCH_MARQUEE",
      coursId: data.coursId,
      classe: data.classe,
      date: data.date,
      nombreEleves: data.presences.length,
      performedBy: context.auth!.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await batch.commit();
      return { success: true };
    } catch (error) {
      handleError(error, "Erreur lors du marquage des presences en lot.");
    }
  });
