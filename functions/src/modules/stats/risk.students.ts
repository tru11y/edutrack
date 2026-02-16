import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

interface AtRiskStudent {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  risks: Array<{
    type: "absence" | "payment" | "grades";
    severity: "warning" | "danger";
    detail: string;
  }>;
}

export const getAtRiskStudents = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Acces reserve aux admins/gestionnaires.");

    try {
      // Fetch all active eleves
      const elevesSnap = await db.collection("eleves")
        .where("statut", "==", "actif")
        .get();

      const atRisk: AtRiskStudent[] = [];

      for (const doc of elevesSnap.docs) {
        const eleve = doc.data();
        const risks: AtRiskStudent["risks"] = [];

        // Check absences (>30% absence rate)
        const presencesSnap = await db.collection("presences")
          .where("eleveId", "==", doc.id)
          .get();

        if (presencesSnap.size > 0) {
          const absences = presencesSnap.docs.filter(
            (p) => p.data().statut === "absent"
          ).length;
          const tauxAbsence = absences / presencesSnap.size;
          if (tauxAbsence > 0.3) {
            risks.push({
              type: "absence",
              severity: tauxAbsence > 0.5 ? "danger" : "warning",
              detail: `${Math.round(tauxAbsence * 100)}% d'absences (${absences}/${presencesSnap.size})`,
            });
          }
        }

        // Check unpaid months (>=2 months unpaid)
        const paiementsSnap = await db.collection("paiements")
          .where("eleveId", "==", doc.id)
          .where("statut", "==", "impaye")
          .get();

        if (paiementsSnap.size >= 2) {
          risks.push({
            type: "payment",
            severity: paiementsSnap.size >= 3 ? "danger" : "warning",
            detail: `${paiementsSnap.size} mois impayes`,
          });
        }

        // Check grades (average < 8/20)
        const notesSnap = await db.collection("notes")
          .where("eleveId", "==", doc.id)
          .get();

        if (notesSnap.size > 0) {
          let totalWeighted = 0;
          let totalMax = 0;
          for (const noteDoc of notesSnap.docs) {
            const n = noteDoc.data();
            totalWeighted += n.note;
            totalMax += n.maxNote || 20;
          }
          const moyenne = totalMax > 0 ? (totalWeighted / notesSnap.size) * (20 / (totalMax / notesSnap.size)) : 0;
          if (moyenne < 8) {
            risks.push({
              type: "grades",
              severity: moyenne < 5 ? "danger" : "warning",
              detail: `Moyenne: ${moyenne.toFixed(1)}/20`,
            });
          }
        }

        if (risks.length > 0) {
          atRisk.push({
            eleveId: doc.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            classe: eleve.classe,
            risks,
          });
        }
      }

      // Sort by number of risks (most at-risk first)
      atRisk.sort((a, b) => b.risks.length - a.risks.length);

      return { success: true, students: atRisk };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des eleves a risque.");
    }
  });
