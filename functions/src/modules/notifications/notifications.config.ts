import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const getNotificationConfig = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seul l'admin peut voir la configuration.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const doc = await db.collection("notification_config").doc(schoolId).get();
      const defaultConfig = {
        autoAbsenceNotif: true,
        autoImpayeNotif: true,
        inAppEnabled: true,
        smsEnabled: false,
        emailEnabled: false,
        webhookUrls: [] as string[],
      };
      if (!doc.exists) {
        return { success: true, config: defaultConfig };
      }
      return { success: true, config: { ...defaultConfig, ...doc.data() } };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation de la config.");
    }
  });

export const updateNotificationConfig = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seul l'admin peut modifier la configuration.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      await db.collection("notification_config").doc(schoolId).set(
        { ...data, schoolId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return { success: true, message: "Configuration mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la config.");
    }
  });
