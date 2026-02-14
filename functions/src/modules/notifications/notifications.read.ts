import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { requireAuth, requireArgument, notFound, handleError } from "../../helpers/errors";

export const markNotificationRead = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string }, context) => {
    requireAuth(context.auth?.uid);
    requireArgument(!!data.id, "L'ID de la notification est requis.");

    const ref = db.collection("notifications").doc(data.id);
    const snap = await ref.get();
    if (!snap.exists) notFound("Notification non trouvee.");

    if (snap.data()!.recipientId !== context.auth!.uid) {
      throw new functions.https.HttpsError("permission-denied", "Cette notification ne vous appartient pas.");
    }

    try {
      await ref.update({
        status: "read",
        readAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      handleError(error, "Erreur lors du marquage de la notification.");
    }
  });
