import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface GetEvaluationsData {
  classe?: string;
  matiere?: string;
  trimestre?: number;
  professeurId?: string;
}

export const getEvaluationsByClasse = functions
  .region("europe-west1")
  .https.onCall(async (data: GetEvaluationsData, context) => {
    requireAuth(context.auth?.uid);
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("evaluations")
        .where("schoolId", "==", schoolId);

      if (data.classe) {
        query = query.where("classe", "==", data.classe);
      }
      if (data.matiere) {
        query = query.where("matiere", "==", data.matiere);
      }
      if (data.trimestre) {
        query = query.where("trimestre", "==", data.trimestre);
      }
      if (data.professeurId) {
        query = query.where("professeurId", "==", data.professeurId);
      }

      const snap = await query.orderBy("date", "desc").get();
      const evaluations = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, evaluations };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des evaluations.");
    }
  });
