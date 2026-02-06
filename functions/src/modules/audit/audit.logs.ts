import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

export const getAuditLogs = functions
  .region("europe-west1")
  .https.onCall(async (data: { limit?: number }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent voir les logs d'audit.");

    const queryLimit = data?.limit || 100;
    const safeLimit = Math.min(queryLimit, 500);

    try {
      const logsSnapshot = await db.collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(safeLimit)
        .get();

      const logs = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, logs };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des logs.");
    }
  });
