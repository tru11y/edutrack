import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

export const triggerAbsenceNotification = functions
  .region("europe-west1")
  .https.onCall(async (data: { eleveId: string; date: string; classe: string }, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff);

    try {
      // Find parent of this student
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
          type: "absence",
          recipientId: parentDoc.id,
          channel: "in_app",
          status: "sent",
          payload: {
            title: "Absence signalee",
            message: `Votre enfant a ete marque absent le ${data.date} (${data.classe}).`,
            context: { eleveId: data.eleveId, date: data.date, classe: data.classe },
          },
          senderId: context.auth!.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
        });
      }

      await batch.commit();
      return { success: true, count: parentUsers.length };
    } catch (error) {
      handleError(error, "Erreur lors de l'envoi des notifications d'absence.");
    }
  });
