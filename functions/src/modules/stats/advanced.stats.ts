import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const getAdvancedStats = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      // Presences by month
      const presencesSnap = await db.collectionGroup("appels").where("schoolId", "==", schoolId).get();
      const presencesByMonth: Record<string, { present: number; absent: number; retard: number }> = {};
      for (const m of months) presencesByMonth[m] = { present: 0, absent: 0, retard: 0 };

      for (const doc of presencesSnap.docs) {
        const d = doc.data();
        const dateStr = typeof d.date === "string" ? d.date.substring(0, 7) : "";
        if (presencesByMonth[dateStr]) {
          if (d.statut === "present") presencesByMonth[dateStr].present++;
          else if (d.statut === "absent") presencesByMonth[dateStr].absent++;
          else if (d.statut === "retard") presencesByMonth[dateStr].retard++;
        }
      }

      // Paiements by month
      const paiementsSnap = await db.collection("paiements").where("schoolId", "==", schoolId).get();
      const paiementsByMonth: Record<string, { total: number; paye: number }> = {};
      for (const m of months) paiementsByMonth[m] = { total: 0, paye: 0 };

      for (const doc of paiementsSnap.docs) {
        const d = doc.data();
        const mois = d.mois || "";
        if (paiementsByMonth[mois]) {
          paiementsByMonth[mois].total += d.montantTotal || 0;
          paiementsByMonth[mois].paye += d.montantPaye || 0;
        }
      }

      // Inscriptions by month
      const elevesSnap = await db.collection("eleves").where("schoolId", "==", schoolId).get();
      const inscriptionsByMonth: Record<string, number> = {};
      for (const m of months) inscriptionsByMonth[m] = 0;

      for (const doc of elevesSnap.docs) {
        const d = doc.data();
        if (d.createdAt?.toDate) {
          const createdMonth = d.createdAt.toDate().toISOString().substring(0, 7);
          if (inscriptionsByMonth[createdMonth] !== undefined) {
            inscriptionsByMonth[createdMonth]++;
          }
        }
      }

      return {
        success: true,
        months,
        presencesByMonth,
        paiementsByMonth,
        inscriptionsByMonth,
      };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des statistiques avancees.");
    }
  });
