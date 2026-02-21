import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyProf, verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { VALID_PRESENCE_STATUTS } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

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
    const schoolId = await getSchoolId(context.auth!.uid);

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

    // Controle horaire (sauf admin/gestionnaire)
    const isStaff = await verifyAdminOrGestionnaire(context.auth!.uid);
    if (!isStaff) {
      const GRACE_PERIOD_MS = 15 * 60 * 1000;

      const parseDateStr = (): string => {
        if (coursData.date instanceof admin.firestore.Timestamp) {
          return coursData.date.toDate().toISOString().split("T")[0];
        }
        return String(coursData.date || "");
      };

      let debutMillis: number;
      let finMillis: number;

      if (typeof coursData.heureDebut === "string") {
        const [hh, mm] = coursData.heureDebut.split(":").map(Number);
        const d = new Date(`${parseDateStr()}T00:00:00`);
        d.setHours(hh, mm, 0, 0);
        debutMillis = d.getTime();
      } else {
        debutMillis = coursData.heureDebut?.toMillis?.() || 0;
      }

      if (typeof coursData.heureFin === "string") {
        const [hh, mm] = coursData.heureFin.split(":").map(Number);
        const d = new Date(`${parseDateStr()}T00:00:00`);
        d.setHours(hh, mm, 0, 0);
        finMillis = d.getTime();
      } else {
        finMillis = coursData.heureFin?.toMillis?.() || 0;
      }

      const now = admin.firestore.Timestamp.now();
      if (now.toMillis() < debutMillis || now.toMillis() > finMillis + GRACE_PERIOD_MS) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "La presence ne peut etre marquee que pendant le cours (+ 15 min apres la fin)."
        );
      }
    }

    const batch = db.batch();

    // Creer/mettre a jour le document parent avec le resume de l'appel
    const parentRef = db.collection("presences").doc(data.coursId);
    const presencesSummary = data.presences.map((e) => ({
      eleveId: e.eleveId,
      statut: e.statut,
      minutesRetard: e.statut === "retard" ? e.minutesRetard || 0 : undefined,
      facturable: e.statut !== "absent",
      statutMetier: "autorise",
      message: "",
    }));

    batch.set(
      parentRef,
      {
        coursId: data.coursId,
        classe: data.classe,
        date: data.date,
        presences: presencesSummary,
        marqueePar: context.auth!.uid,
        schoolId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Ecrire chaque appel individuel dans la subcollection
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
          schoolId,
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
      schoolId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await batch.commit();
      return { success: true };
    } catch (error) {
      handleError(error, "Erreur lors du marquage des presences en lot.");
    }
  });
