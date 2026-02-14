import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, handleError } from "../../helpers/errors";

export const getEmploiDuTempsClasse = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe: string }, context) => {
    requireAuth(context.auth?.uid);

    try {
      const snap = await db.collection("emploi_du_temps")
        .where("classe", "==", data.classe)
        .get();

      const creneaux = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, creneaux };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation de l'emploi du temps.");
    }
  });

export const getEmploiDuTempsProf = functions
  .region("europe-west1")
  .https.onCall(async (data: { professeurId: string }, context) => {
    requireAuth(context.auth?.uid);

    try {
      const snap = await db.collection("emploi_du_temps")
        .where("professeurId", "==", data.professeurId)
        .get();

      const creneaux = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, creneaux };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation de l'emploi du temps du professeur.");
    }
  });
