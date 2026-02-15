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

      // Resolve user names for performedBy UIDs
      const uidSet = new Set<string>();
      for (const d of logsSnapshot.docs) {
        const uid = d.data().performedBy;
        if (uid) uidSet.add(uid);
      }

      const userNames: Record<string, string> = {};
      const uids = [...uidSet];
      // Firestore in-query limit is 30
      for (let i = 0; i < uids.length; i += 30) {
        const batch = uids.slice(i, i + 30);
        const usersSnap = await db.collection("users").where("__name__", "in", batch).get();
        for (const u of usersSnap.docs) {
          const d = u.data();
          userNames[u.id] = `${d.prenom || ""} ${d.nom || ""}`.trim() || d.email || u.id;
        }
      }

      const logs = logsSnapshot.docs.map((d) => {
        const data = d.data();
        const uid = data.performedBy || "";
        return {
          id: d.id,
          ...data,
          performedByName: data.performedByName || userNames[uid] || uid,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, logs };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des logs.");
    }
  });
