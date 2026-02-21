import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getLastDayOfMonth } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

// FIX C2: Optimiser queries Firestore par mois
export const getComptaStats = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Seuls les administrateurs et gestionnaires peuvent voir les statistiques comptables.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let totalPaiementsRecus = 0;
      let totalDepenses = 0;
      let totalSalaires = 0;

      if (data?.mois) {
        const startDate = `${data.mois}-01`;
        const endDate = getLastDayOfMonth(data.mois);

        const [paiementsSnap, depensesSnap, salairesSnap] = await Promise.all([
          db.collection("paiements").where("schoolId", "==", schoolId).where("mois", "==", data.mois).get(),
          db.collection("depenses").where("schoolId", "==", schoolId).where("date", ">=", startDate).where("date", "<=", endDate).get(),
          db.collection("salaires").where("schoolId", "==", schoolId).where("mois", "==", data.mois).get(),
        ]);

        paiementsSnap.docs.forEach((doc) => {
          totalPaiementsRecus += doc.data().montantPaye || 0;
        });
        depensesSnap.docs.forEach((doc) => {
          totalDepenses += doc.data().montant || 0;
        });
        salairesSnap.docs.forEach((doc) => {
          if (doc.data().statut === "paye") {
            totalSalaires += doc.data().montant || 0;
          }
        });
      } else {
        const [paiementsSnap, depensesSnap, salairesSnap] = await Promise.all([
          db.collection("paiements").where("schoolId", "==", schoolId).get(),
          db.collection("depenses").where("schoolId", "==", schoolId).get(),
          db.collection("salaires").where("schoolId", "==", schoolId).get(),
        ]);

        paiementsSnap.docs.forEach((doc) => {
          totalPaiementsRecus += doc.data().montantPaye || 0;
        });
        depensesSnap.docs.forEach((doc) => {
          totalDepenses += doc.data().montant || 0;
        });
        salairesSnap.docs.forEach((doc) => {
          if (doc.data().statut === "paye") {
            totalSalaires += doc.data().montant || 0;
          }
        });
      }

      const resultatNet = totalPaiementsRecus - (totalDepenses + totalSalaires);

      return {
        success: true,
        stats: {
          totalPaiementsRecus,
          totalDepenses,
          totalSalaires,
          resultatNet,
          mois: data?.mois || "all",
        },
      };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des statistiques comptables.");
    }
  });
