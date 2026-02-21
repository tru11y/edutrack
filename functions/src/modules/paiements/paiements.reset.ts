import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { getCurrentMonth } from "../../helpers/validation";

// FIX C5: Firestore batch limit = 500 docs
const BATCH_SIZE = 500;

export const resetStatutPaiementMensuel = functions
  .region("europe-west1")
  .pubsub.schedule("0 0 1 * *")
  .timeZone("Africa/Dakar")
  .onRun(async () => {
    const schoolsSnap = await db.collection("schools").get();

    if (schoolsSnap.empty) {
      console.log("Aucune ecole trouvee.");
      return null;
    }

    for (const schoolDoc of schoolsSnap.docs) {
      const schoolId = schoolDoc.id;
      const elevesSnap = await db.collection("eleves").where("schoolId", "==", schoolId).get();

      if (elevesSnap.empty) {
        console.log(`Aucun eleve trouve pour l'ecole ${schoolId}.`);
        continue;
      }

      const docs = elevesSnap.docs;
      let count = 0;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + BATCH_SIZE);

        chunk.forEach((doc) => {
          batch.update(doc.ref, {
            statutPaiementMensuel: "non_a_jour",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          count++;
        });

        await batch.commit();
      }

      await db.collection("audit_logs").add({
        action: "RESET_STATUT_PAIEMENT_MENSUEL",
        mois: getCurrentMonth(),
        elevesCount: count,
        schoolId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Statut paiement reset pour ${count} eleves de l'ecole ${schoolId}.`);
    }

    return null;
  });
