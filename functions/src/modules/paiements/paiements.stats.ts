import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission } from "../../helpers/errors";
import { getCurrentMonth } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface StatsPaiementMensuel {
  mois: string;
  totalEleves: number;
  elevesAJour: number;
  elevesNonAJour: number;
  totalPaye: number;
  totalAttendu: number;
  tauxCouverture: number;
}

export const getStatsPaiementMensuel = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized);
    const schoolId = await getSchoolId(context.auth!.uid);

    const mois = data?.mois || getCurrentMonth();

    const [elevesSnap, paiementsSnap, configSnap] = await Promise.all([
      db.collection("eleves").where("schoolId", "==", schoolId).where("statut", "==", "actif").get(),
      db.collection("paiements").where("schoolId", "==", schoolId).where("mois", "==", mois).get(),
      db.collection("config").doc("ecole").get(),
    ]);

    const totalEleves = elevesSnap.size;
    const mensualite = configSnap.exists ? (configSnap.data()?.mensualite || 0) : 0;
    const totalAttendu = totalEleves * mensualite;

    let totalPaye = 0;
    const elevesPaye = new Set<string>();

    paiementsSnap.docs.forEach((doc) => {
      const p = doc.data();
      totalPaye += p.montantPaye || 0;
      elevesPaye.add(p.eleveId);
    });

    const elevesAJour = elevesPaye.size;
    const elevesNonAJour = totalEleves - elevesAJour;
    const tauxCouverture = totalAttendu > 0 ? Math.round((totalPaye / totalAttendu) * 100) : 0;

    const stats: StatsPaiementMensuel = {
      mois,
      totalEleves,
      elevesAJour,
      elevesNonAJour,
      totalPaye,
      totalAttendu,
      tauxCouverture,
    };

    return { success: true, stats };
  });
