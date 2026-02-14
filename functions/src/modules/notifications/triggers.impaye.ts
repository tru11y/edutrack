import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

export const triggerImpayeNotification = functions
  .region("europe-west1")
  .https.onCall(async (data: { eleveId: string; mois: string; montantRestant: number }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    try {
      const usersSnap = await db.collection("users")
        .where("role", "==", "parent")
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
        });
      }

      await batch.commit();
      return { success: true, count: parentUsers.length };
    } catch (error) {
      handleError(error, "Erreur lors de l'envoi des notifications d'impaye.");
    }
  });
