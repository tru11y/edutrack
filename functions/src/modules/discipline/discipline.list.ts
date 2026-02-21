import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const getDisciplineRecords = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isStaff = await verifyStaff(context.auth!.uid);
    requirePermission(isStaff, "Seul le staff peut voir les incidents.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("discipline").where("schoolId", "==", schoolId);

      if (data?.classe && typeof data.classe === "string") {
        query = query.where("classe", "==", data.classe);
      }
      if (data?.eleveId && typeof data.eleveId === "string") {
        query = query.where("eleveId", "==", data.eleveId);
      }
      if (data?.type && typeof data.type === "string") {
        query = query.where("type", "==", data.type);
      }

      query = query.orderBy("createdAt", "desc");

      const limit = typeof data?.limit === "number" ? Math.min(data.limit, 500) : 200;
      query = query.limit(limit);

      const snap = await query.get();
      const records = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, records };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des incidents.");
    }
  });
