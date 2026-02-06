import * as functions from "firebase-functions";
import { db, admin } from "./firebase";
import { verifyAdminOrGestionnaire } from "./helpers.auth";

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const resetStatutPaiementMensuel = functions
  .region("europe-west1")
  .pubsub.schedule("0 0 1 * *")
  .timeZone("Africa/Dakar")
  .onRun(async () => {
    const elevesSnap = await db.collection("eleves").get();

    if (elevesSnap.empty) {
      console.log("Aucun eleve trouve.");
      return null;
    }

    const batch = db.batch();
    let count = 0;

    elevesSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        statutPaiementMensuel: "non_a_jour",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    });

    await batch.commit();

    await db.collection("audit_logs").add({
      action: "RESET_STATUT_PAIEMENT_MENSUEL",
      mois: getCurrentMonth(),
      elevesCount: count,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Statut paiement reset pour ${count} eleves.`);
    return null;
  });

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
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAuthorized = await verifyAdminOrGestionnaire(context.auth.uid);
    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Acces refuse."
      );
    }

    const mois = data?.mois || getCurrentMonth();

    const [elevesSnap, paiementsSnap, configSnap] = await Promise.all([
      db.collection("eleves").where("statut", "==", "actif").get(),
      db.collection("paiements").where("mois", "==", mois).get(),
      db.collection("config").doc("ecole").get(),
    ]);

    const totalEleves = elevesSnap.size;
    const mensualite = configSnap.exists ? (configSnap.data()?.mensualite || 0) : 0;
    const totalAttendu = totalEleves * mensualite;

    let totalPaye = 0;
    paiementsSnap.docs.forEach((doc) => {
      const p = doc.data();
      totalPaye += p.montantPaye || 0;
    });

    const elevesPaye = new Set<string>();
    paiementsSnap.docs.forEach((doc) => {
      elevesPaye.add(doc.data().eleveId);
    });

    const elevesAJour = elevesPaye.size;
    const elevesNonAJour = totalEleves - elevesAJour;

    const tauxCouverture = totalAttendu > 0
      ? Math.round((totalPaye / totalAttendu) * 100)
      : 0;

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
