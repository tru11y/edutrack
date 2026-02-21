import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface CreneauData {
  jour: string; // "lundi", "mardi", etc.
  heureDebut: string;
  heureFin: string;
  matiere: string;
  professeurId: string;
  professeurNom: string;
  classe: string;
  salle?: string;
}

export const createCreneauBatch = functions
  .region("europe-west1")
  .https.onCall(async (data: { creneaux: CreneauData[] }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Seuls les admins/gestionnaires peuvent creer des creneaux.");

    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(
      Array.isArray(data.creneaux) && data.creneaux.length > 0,
      "Le tableau de creneaux est requis."
    );

    try {
      const batch = db.batch();

      for (const creneau of data.creneaux) {
        requireArgument(!!creneau.jour, "Le jour est requis.");
        requireArgument(!!creneau.heureDebut, "L'heure de debut est requise.");
        requireArgument(!!creneau.heureFin, "L'heure de fin est requise.");
        requireArgument(!!creneau.matiere, "La matiere est requise.");
        requireArgument(!!creneau.classe, "La classe est requise.");

        const ref = db.collection("emploi_du_temps").doc();
        batch.set(ref, {
          ...creneau,
          schoolId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      return { success: true, message: `${data.creneaux.length} creneaux crees.` };
    } catch (error) {
      handleError(error, "Erreur lors de la creation des creneaux.");
    }
  });
