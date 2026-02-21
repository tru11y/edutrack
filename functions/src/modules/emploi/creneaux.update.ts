import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface UpdateCreneauParams {
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export const updateCreneau = functions
  .region("europe-west1")
  .https.onCall(async (data: UpdateCreneauParams, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Seuls les admins/gestionnaires peuvent modifier les creneaux.");

    requireArgument(!!data.id, "L'ID du creneau est requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const creneauRef = db.collection("emploi_du_temps").doc(data.id);
      const creneauSnap = await creneauRef.get();
      if (!creneauSnap.exists) notFound("Creneau non trouve.");
      if (creneauSnap.data()?.schoolId !== schoolId) notFound("Creneau non trouve.");

      const current = creneauSnap.data()!;
      const updated = {
        jour: data.jour ?? current.jour,
        heureDebut: data.heureDebut ?? current.heureDebut,
        heureFin: data.heureFin ?? current.heureFin,
        matiere: data.matiere ?? current.matiere,
        professeurId: data.professeurId ?? current.professeurId,
        professeurNom: data.professeurNom ?? current.professeurNom,
        classe: data.classe ?? current.classe,
        salle: data.salle ?? current.salle,
      };

      // Check for conflicts with other creneaux
      const allSnap = await db.collection("emploi_du_temps")
        .where("schoolId", "==", schoolId)
        .where("jour", "==", updated.jour)
        .get();

      const conflicts: string[] = [];
      for (const doc of allSnap.docs) {
        if (doc.id === data.id) continue;
        const other = doc.data();
        if (!hasOverlap(updated.heureDebut, updated.heureFin, other.heureDebut, other.heureFin)) continue;

        if (updated.professeurId && updated.professeurId === other.professeurId) {
          conflicts.push(`Conflit prof: ${other.professeurNom || other.professeurId} deja occupe (${other.classe} - ${other.matiere})`);
        }
        if (updated.classe === other.classe) {
          conflicts.push(`Conflit classe: ${other.classe} deja occupee (${other.matiere})`);
        }
      }

      if (conflicts.length > 0) {
        return { success: false, conflicts, message: "Conflits detectes." };
      }

      await creneauRef.update({
        ...updated,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Creneau mis a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour du creneau.");
    }
  });
