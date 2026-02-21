import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyProf } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { VALID_PRESENCE_STATUTS } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface MarquerPresenceData {
  coursId: string;
  eleveId: string;
  statut: "present" | "absent" | "retard" | "excuse";
  minutesRetard?: number;
  commentaire?: string;
}

// FIX C6: API v1 standard (data, context) au lieu de destructuring v2
export const marquerPresence = functions
  .region("europe-west1")
  .https.onCall(async (data: MarquerPresenceData, context) => {
    requireAuth(context.auth?.uid);
    const isProf = await verifyProf(context.auth!.uid);
    requirePermission(isProf, "Seuls les professeurs peuvent marquer les presences.");
    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(!!data.coursId && !!data.eleveId && !!data.statut, "coursId, eleveId et statut sont requis.");
    requireArgument(
      VALID_PRESENCE_STATUTS.includes(data.statut),
      "Statut invalide."
    );

    const coursDoc = await db.collection("cours").doc(data.coursId).get();
    if (!coursDoc.exists) notFound("Cours non trouve.");

    const coursData = coursDoc.data()!;

    const estAutorise =
      coursData.professeurId === context.auth!.uid ||
      coursData.type === "exceptionnel";

    requirePermission(estAutorise, "Vous n'etes pas autorise a modifier ce cours.");

    // Support Firestore Timestamps et strings "HH:mm"
    let debutMillis: number;
    let finMillis: number;

    const parseDateStr = (): string => {
      if (coursData.date instanceof admin.firestore.Timestamp) {
        return coursData.date.toDate().toISOString().split("T")[0];
      }
      return String(coursData.date || "");
    };

    if (coursData.heureDebut instanceof admin.firestore.Timestamp) {
      debutMillis = coursData.heureDebut.toMillis();
    } else if (typeof coursData.heureDebut === "string") {
      const [hh, mm] = coursData.heureDebut.split(":").map(Number);
      const d = new Date(`${parseDateStr()}T00:00:00`);
      d.setHours(hh, mm, 0, 0);
      debutMillis = d.getTime();
    } else {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "heureDebut doit etre un Timestamp ou une chaine HH:mm."
      );
    }

    if (coursData.heureFin instanceof admin.firestore.Timestamp) {
      finMillis = coursData.heureFin.toMillis();
    } else if (typeof coursData.heureFin === "string") {
      const [hh, mm] = coursData.heureFin.split(":").map(Number);
      const d = new Date(`${parseDateStr()}T00:00:00`);
      d.setHours(hh, mm, 0, 0);
      finMillis = d.getTime();
    } else {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "heureFin doit etre un Timestamp ou une chaine HH:mm."
      );
    }

    const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes après la fin
    const now = admin.firestore.Timestamp.now();
    if (now.toMillis() < debutMillis || now.toMillis() > finMillis + GRACE_PERIOD_MS) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "La presence ne peut etre marquee que pendant le cours (+ 15 min apres la fin)."
      );
    }

    const eleveDoc = await db.collection("eleves").doc(data.eleveId).get();
    if (!eleveDoc.exists) notFound("Eleve non trouve.");

    const eleveData = eleveDoc.data()!;
    const eleveClasse = eleveData.classe || eleveData.classeId;
    const coursClasse = coursData.classe || coursData.classeId;

    if (eleveClasse !== coursClasse) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "L'eleve n'appartient pas a la classe de ce cours."
      );
    }

    const presenceRef = db
      .collection("presences")
      .doc(data.coursId)
      .collection("appels")
      .doc(data.eleveId);

    const auditRef = db.collection("audit_logs").doc();

    try {
      await db.runTransaction(async (transaction) => {
        transaction.set(
          presenceRef,
          {
            eleveId: data.eleveId,
            eleveNom: `${eleveData.prenom || ""} ${eleveData.nom || ""}`.trim(),
            statut: data.statut,
            minutesRetard: data.statut === "retard" ? data.minutesRetard || 0 : null,
            commentaire: data.commentaire || null,
            coursId: data.coursId,
            classe: coursClasse,
            marqueePar: context.auth!.uid,
            schoolId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(auditRef, {
          action: "PRESENCE_MARQUEE",
          coursId: data.coursId,
          eleveId: data.eleveId,
          statut: data.statut,
          classe: coursClasse,
          performedBy: context.auth!.uid,
          schoolId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true };
    } catch (error) {
      handleError(error, "Erreur lors du marquage de la presence.");
    }
  });
