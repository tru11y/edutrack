import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface PromoteClasseParams {
  sourceClasse: string;
  targetClasse: string;
  anneeScolaire: string;
}

export const promoteClasse = functions
  .region("europe-west1")
  .https.onCall(async (data: PromoteClasseParams, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les admins peuvent promouvoir les classes.");

    requireArgument(!!data.sourceClasse, "La classe source est requise.");
    requireArgument(!!data.targetClasse, "La classe cible est requise.");
    requireArgument(!!data.anneeScolaire, "L'annee scolaire est requise.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const elevesSnap = await db.collection("eleves")
        .where("schoolId", "==", schoolId)
        .where("classe", "==", data.sourceClasse)
        .where("statut", "==", "actif")
        .get();

      if (elevesSnap.empty) {
        return { success: false, message: "Aucun eleve actif dans cette classe.", count: 0 };
      }

      const batch = db.batch();
      let count = 0;

      for (const doc of elevesSnap.docs) {
        batch.update(doc.ref, {
          classe: data.targetClasse,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      }

      // Audit log
      const auditRef = db.collection("audit_logs").doc();
      batch.set(auditRef, {
        action: "promotion_classe",
        performedBy: context.auth!.uid,
        schoolId,
        details: {
          sourceClasse: data.sourceClasse,
          targetClasse: data.targetClasse,
          anneeScolaire: data.anneeScolaire,
          elevesCount: count,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return {
        success: true,
        count,
        message: `${count} eleves promus de ${data.sourceClasse} vers ${data.targetClasse}.`,
      };
    } catch (error) {
      handleError(error, "Erreur lors de la promotion de classe.");
    }
  });
