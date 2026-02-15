import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";

export const deleteDisciplineRecord = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Seul l'admin ou gestionnaire peut supprimer un incident.");

    const { id } = data;
    requireArgument(typeof id === "string" && id.length > 0, "ID de l'incident requis.");

    try {
      const ref = db.collection("discipline").doc(id as string);
      const snap = await ref.get();
      if (!snap.exists) notFound("Incident non trouve.");

      await ref.delete();
      return { success: true, message: "Incident supprime." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de l'incident.");
    }
  });
