import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { isSuperAdmin } from "../../helpers/tenant";

export const listSchools = functions
  .region("europe-west1")
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const superAdmin = await isSuperAdmin(context.auth!.uid);
    requirePermission(superAdmin, "Seuls les super administrateurs peuvent lister les ecoles.");

    try {
      const snap = await db.collection("schools").orderBy("createdAt", "desc").get();
      const schools = await Promise.all(
        snap.docs.map(async (doc) => {
          const data = doc.data();
          // Count students
          const elevesSnap = await db.collection("eleves")
            .where("schoolId", "==", doc.id)
            .count()
            .get();
          // Count users
          const usersSnap = await db.collection("users")
            .where("schoolId", "==", doc.id)
            .count()
            .get();
          // Get subscription
          const subSnap = await db.collection("school_subscriptions").doc(doc.id).get();
          const sub = subSnap.exists ? subSnap.data() : null;

          return {
            id: doc.id,
            schoolName: data.schoolName,
            email: data.email,
            plan: sub?.plan || "free",
            maxEleves: sub?.maxEleves || 50,
            totalEleves: elevesSnap.data().count,
            totalUsers: usersSnap.data().count,
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          };
        })
      );

      return { success: true, schools };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des ecoles.");
    }
  });
