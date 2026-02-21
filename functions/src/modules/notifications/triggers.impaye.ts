import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { sendPushToUser } from "../../helpers/push";
import { getSchoolId } from "../../helpers/tenant";

export const triggerImpayeNotification = functions
  .region("europe-west1")
  .https.onCall(async (data: { eleveId: string; mois: string; montantRestant: number }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const usersSnap = await db.collection("users")
        .where("role", "==", "parent")
        .where("schoolId", "==", schoolId)
        .get();

      const parentUsers = usersSnap.docs.filter((doc) => {
        const enfants = doc.data().enfantsIds || [];
        return enfants.includes(data.eleveId);
      });

      const batch = db.batch();
      for (const parentDoc of parentUsers) {
        const ref = db.collection("notifications").doc();
        batch.set(ref, {
          type: "impaye",
          recipientId: parentDoc.id,
          channel: "in_app",
          status: "sent",
          payload: {
            title: "Paiement en retard",
            message: `Un paiement de ${data.montantRestant.toLocaleString()} FCFA est en attente pour le mois ${data.mois}.`,
            context: { eleveId: data.eleveId, mois: data.mois, montantRestant: data.montantRestant },
          },
          senderId: context.auth!.uid,
          schoolId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
        });
      }

      await batch.commit();

      // Send push notifications
      for (const parentDoc of parentUsers) {
        await sendPushToUser(
          parentDoc.id,
          "Paiement en retard",
          `Un paiement de ${data.montantRestant.toLocaleString()} FCFA est en attente pour le mois ${data.mois}.`
        );
      }

      return { success: true, count: parentUsers.length };
    } catch (error) {
      handleError(error, "Erreur lors de l'envoi des notifications d'impaye.");
    }
  });
