import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { isSuperAdmin } from "../../helpers/tenant";

export const getSchoolsStats = functions
  .region("europe-west1")
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const superAdmin = await isSuperAdmin(context.auth!.uid);
    requirePermission(superAdmin, "Seuls les super administrateurs peuvent voir les stats.");

    try {
      const schoolsSnap = await db.collection("schools").get();
      const totalSchools = schoolsSnap.size;

      const usersSnap = await db.collection("users").count().get();
      const totalUsers = usersSnap.data().count;

      const elevesSnap = await db.collection("eleves").count().get();
      const totalEleves = elevesSnap.data().count;

      const subsSnap = await db.collection("school_subscriptions").get();
      const planCounts: Record<string, number> = {};
      let activeSchools = 0;
      subsSnap.docs.forEach((doc) => {
        const data = doc.data();
        const plan = data.plan || "free";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
        if (data.status === "active") activeSchools++;
      });

      return {
        success: true,
        stats: {
          totalSchools,
          activeSchools,
          totalUsers,
          totalEleves,
          planCounts,
        },
      };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des stats.");
    }
  });
