import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

interface ArchiveParams {
  anneeScolaire: string;
  deleteOriginals?: boolean;
}

const COLLECTIONS_TO_ARCHIVE = ["eleves", "notes", "bulletins", "presences", "paiements"];

export const archiveAnneeScolaire = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540 })
  .https.onCall(async (data: ArchiveParams, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les admins peuvent archiver.");

    requireArgument(!!data.anneeScolaire, "L'annee scolaire est requise.");

    try {
      const stats: Record<string, number> = {};

      for (const collName of COLLECTIONS_TO_ARCHIVE) {
        const snap = await db.collection(collName).get();
        const archivePath = `archives/${data.anneeScolaire}/${collName}`;
        let count = 0;

        // Process in batches of 500
        const batchSize = 500;
        for (let i = 0; i < snap.docs.length; i += batchSize) {
          const batch = db.batch();
          const chunk = snap.docs.slice(i, i + batchSize);

          for (const doc of chunk) {
            const archiveRef = db.collection(archivePath).doc(doc.id);
            batch.set(archiveRef, {
              ...doc.data(),
              _archivedAt: admin.firestore.FieldValue.serverTimestamp(),
              _archivedBy: context.auth!.uid,
            });

            if (data.deleteOriginals) {
              batch.delete(doc.ref);
            }

            count++;
          }

          await batch.commit();
        }

        stats[collName] = count;
      }

      // Audit log
      await db.collection("audit_logs").add({
        action: "archive_annee_scolaire",
        performedBy: context.auth!.uid,
        details: {
          anneeScolaire: data.anneeScolaire,
          deleteOriginals: data.deleteOriginals || false,
          stats,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        stats,
        message: `Archivage de l'annee ${data.anneeScolaire} termine.`,
      };
    } catch (error) {
      handleError(error, "Erreur lors de l'archivage.");
    }
  });
