import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";

export const updateDisciplineRecord = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isStaff = await verifyStaff(context.auth!.uid);
    requirePermission(isStaff, "Seul le staff peut modifier un incident.");

    const { id, ...updates } = data;
    requireArgument(typeof id === "string" && id.length > 0, "ID de l'incident requis.");

    try {
      const ref = db.collection("discipline").doc(id as string);
      const snap = await ref.get();
      if (!snap.exists) notFound("Incident non trouve.");

      const allowedFields = ["type", "description", "motif", "sanction"];
      const cleanUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) {
          cleanUpdates[key] = updates[key];
        }
      }
      cleanUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await ref.update(cleanUpdates);
      return { success: true, message: "Incident mis a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de l'incident.");
    }
  });
