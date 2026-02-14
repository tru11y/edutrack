import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

interface ClasseStats {
  classe: string;
  totalEleves: number;
  tauxPresence: number;
  moyenneNotes: number;
  tauxPaiement: number;
}

export const getClasseComparison = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    try {
      const classesSnap = await db.collection("classes").get();
      const classeNames = classesSnap.docs.map((d) => d.data().nom || d.id);

      const elevesSnap = await db.collection("eleves").where("statut", "==", "actif").get();
      const presencesSnap = await db.collectionGroup("appels").get();
      const paiementsSnap = await db.collection("paiements").get();
      const bulletinsSnap = await db.collection("bulletins").get();

      // Group data by classe
      const result: ClasseStats[] = [];

      for (const classe of classeNames) {
        const classEleves = elevesSnap.docs.filter((d) => d.data().classe === classe);
        const classEleveIds = new Set(classEleves.map((d) => d.id));
        const totalEleves = classEleves.length;

        // Presences
        const classPresences = presencesSnap.docs.filter((d) => classEleveIds.has(d.data().eleveId));
        const totalPresences = classPresences.length;
        const presentsCount = classPresences.filter((d) => d.data().statut === "present" || d.data().statut === "retard").length;
        const tauxPresence = totalPresences > 0 ? Math.round((presentsCount / totalPresences) * 100) : 0;

        // Notes (from bulletins)
        const classBulletins = bulletinsSnap.docs.filter((d) => d.data().classe === classe);
        let moyenneNotes = 0;
        if (classBulletins.length > 0) {
          const totalMoy = classBulletins.reduce((s, d) => s + (d.data().moyenneGenerale || 0), 0);
          moyenneNotes = Math.round((totalMoy / classBulletins.length) * 100) / 100;
        }

        // Paiements
        const classPaiements = paiementsSnap.docs.filter((d) => classEleveIds.has(d.data().eleveId));
        const totalMontant = classPaiements.reduce((s, d) => s + (d.data().montantTotal || 0), 0);
        const totalPaye = classPaiements.reduce((s, d) => s + (d.data().montantPaye || 0), 0);
        const tauxPaiement = totalMontant > 0 ? Math.round((totalPaye / totalMontant) * 100) : 0;

        result.push({
          classe,
          totalEleves,
          tauxPresence,
          moyenneNotes,
          tauxPaiement,
        });
      }

      return { success: true, classes: result };
    } catch (error) {
      handleError(error, "Erreur lors de la comparaison des classes.");
    }
  });
