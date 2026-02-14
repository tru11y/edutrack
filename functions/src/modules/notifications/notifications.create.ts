import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

interface SendNotificationData {
  type: "absence" | "retard" | "impaye" | "bulletin" | "general";
  recipientId: string;
  channel: "in_app" | "sms" | "email";
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

export const sendNotification = functions
  .region("europe-west1")
  .https.onCall(async (data: SendNotificationData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut envoyer des notifications.");

    requireArgument(!!data.recipientId, "Le destinataire est requis.");
    requireArgument(!!data.title, "Le titre est requis.");
    requireArgument(!!data.message, "Le message est requis.");

    try {
      const ref = await db.collection("notifications").add({
        type: data.type || "general",
        recipientId: data.recipientId,
        channel: data.channel || "in_app",
        status: data.channel === "in_app" ? "sent" : "pending",
        payload: {
          title: data.title,
          message: data.message,
          context: data.context || {},
        },
        senderId: context.auth!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readAt: null,
      });

      return { success: true, id: ref.id, message: "Notification envoyee." };
    } catch (error) {
      handleError(error, "Erreur lors de l'envoi de la notification.");
    }
  });
