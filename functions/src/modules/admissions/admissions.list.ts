import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const listAdmissions = functions
  .region("europe-west1")
  .https.onCall(async (data: { statut?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("admissions")
        .where("schoolId", "==", schoolId)
        .orderBy("createdAt", "desc");

      if (data?.statut) {
        query = query.where("statut", "==", data.statut);
      }

      const snap = await query.limit(200).get();
      const admissions = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, admissions };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des candidatures.");
    }
  });
