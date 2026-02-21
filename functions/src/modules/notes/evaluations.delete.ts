import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const deleteEvaluation = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Seuls les admins/gestionnaires peuvent supprimer des evaluations.");
    requireArgument(!!data.id, "L'ID de l'evaluation est requis.");

    const evalRef = db.collection("evaluations").doc(data.id);
    const evalSnap = await evalRef.get();
    if (!evalSnap.exists) notFound("Evaluation non trouvee.");

    const schoolId = await getSchoolId(context.auth!.uid);
    const evalData = evalSnap.data()!;
    if (evalData.schoolId && evalData.schoolId !== schoolId) {
      requirePermission(false, "Cette evaluation n'appartient pas a votre etablissement.");
    }

    try {
      // Delete associated notes
      const notesSnap = await db.collection("notes")
        .where("evaluationId", "==", data.id)
        .get();

      const batch = db.batch();
      notesSnap.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(evalRef);
      await batch.commit();

      return { success: true, message: "Evaluation et notes associees supprimees." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de l'evaluation.");
    }
  });
