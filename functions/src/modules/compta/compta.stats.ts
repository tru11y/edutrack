import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

// FIX C2: Optimiser queries Firestore par mois
export const getComptaStats = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent voir les statistiques comptables.");

    try {
      let totalPaiementsRecus = 0;
      let totalDepenses = 0;
      let totalSalaires = 0;

      if (data?.mois) {
        const startDate = `${data.mois}-01`;
        const endDate = `${data.mois}-31`;

        const [paiementsSnap, depensesSnap, salairesSnap] = await Promise.all([
          db.collection("paiements").where("mois", "==", data.mois).get(),
          db.collection("depenses").where("date", ">=", startDate).where("date", "<=", endDate).get(),
          db.collection("salaires").where("mois", "==", data.mois).get(),
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
          db.collection("paiements").get(),
          db.collection("depenses").get(),
          db.collection("salaires").get(),
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
