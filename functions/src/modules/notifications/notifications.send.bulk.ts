import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

interface SendBulkNotificationData {
  title: string;
  message: string;
  targetType: "all" | "classe" | "role";
  targetValue?: string; // classe name or role
}

export const sendBulkNotification = functions
  .region("europe-west1")
  .https.onCall(async (data: SendBulkNotificationData, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Seuls les admins/gestionnaires peuvent envoyer des notifications en masse.");

    requireArgument(!!data.title, "Le titre est requis.");
    requireArgument(!!data.message, "Le message est requis.");

    try {
      let recipientIds: string[] = [];

      if (data.targetType === "all") {
        const usersSnap = await db.collection("users").where("isActive", "==", true).get();
        recipientIds = usersSnap.docs.map((d) => d.id);
      } else if (data.targetType === "role" && data.targetValue) {
        const usersSnap = await db.collection("users")
          .where("role", "==", data.targetValue)
          .where("isActive", "==", true)
          .get();
        recipientIds = usersSnap.docs.map((d) => d.id);
      } else if (data.targetType === "classe" && data.targetValue) {
        // Get eleves in this class, then find their parent users
        const elevesSnap = await db.collection("eleves")
          .where("classe", "==", data.targetValue)
          .where("statut", "==", "actif")
          .get();
        const eleveIds = elevesSnap.docs.map((d) => d.id);

        // Find users linked to these eleves (parents + eleves)
        const usersSnap = await db.collection("users").where("isActive", "==", true).get();
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.eleveId && eleveIds.includes(userData.eleveId)) {
            recipientIds.push(userDoc.id);
          }
          if (userData.enfantsIds) {
            const hasChild = userData.enfantsIds.some((id: string) => eleveIds.includes(id));
            if (hasChild) recipientIds.push(userDoc.id);
          }
        }
      }

      // Remove duplicates and sender
      recipientIds = [...new Set(recipientIds)].filter((id) => id !== context.auth!.uid);

      // Batch write notifications
      const batchSize = 450; // Firestore limit ~500
      for (let i = 0; i < recipientIds.length; i += batchSize) {
        const batch = db.batch();
        const chunk = recipientIds.slice(i, i + batchSize);
        for (const recipientId of chunk) {
          const ref = db.collection("notifications").doc();
          batch.set(ref, {
            type: "general",
            recipientId,
            channel: "in_app",
            status: "sent",
            payload: {
              title: data.title,
              message: data.message,
              context: { targetType: data.targetType, targetValue: data.targetValue },
            },
            senderId: context.auth!.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readAt: null,
          });
        }
        await batch.commit();
      }

      return { success: true, count: recipientIds.length, message: `${recipientIds.length} notifications envoyees.` };
    } catch (error) {
      handleError(error, "Erreur lors de l'envoi des notifications en masse.");
    }
  });
