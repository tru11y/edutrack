import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, handleError } from "../../helpers/errors";

export const getNotifications = functions
  .region("europe-west1")
  .https.onCall(async (data: { limit?: number }, context) => {
    requireAuth(context.auth?.uid);

    try {
      const limit = data.limit || 50;
      const snap = await db.collection("notifications")
        .where("recipientId", "==", context.auth!.uid)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const notifications = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || null,
      }));

      const unreadCount = notifications.filter((n: Record<string, unknown>) => !n.readAt).length;

      return { success: true, notifications, unreadCount };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des notifications.");
    }
  });
