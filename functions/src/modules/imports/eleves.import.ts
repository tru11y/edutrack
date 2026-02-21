import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface EleveRow {
  nom: string;
  prenom: string;
  classe: string;
  sexe?: string;
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
}

export const importElevesCsv = functions
  .region("europe-west1")
  .https.onCall(async (data: { rows: EleveRow[]; dryRun?: boolean }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Seul l'admin ou gestionnaire peut importer des eleves.");

    const schoolId = await getSchoolId(context.auth!.uid);

    const { rows, dryRun } = data;
    requireArgument(Array.isArray(rows) && rows.length > 0, "Aucune ligne a importer.");
    requireArgument(rows.length <= 500, "Maximum 500 lignes par import.");

    const errors: Array<{ row: number; message: string }> = [];
    const validRows: EleveRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.nom || !r.prenom || !r.classe) {
        errors.push({ row: i + 1, message: "nom, prenom et classe sont requis." });
        continue;
      }
      if (r.sexe && !["M", "F"].includes(r.sexe.toUpperCase())) {
        errors.push({ row: i + 1, message: "sexe doit etre M ou F." });
        continue;
      }
      validRows.push(r);
    }

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        totalRows: rows.length,
        validRows: validRows.length,
        errors,
      };
    }

    try {
      const batch = db.batch();
      let count = 0;

      for (const r of validRows) {
        const ref = db.collection("eleves").doc();
        batch.set(ref, {
          nom: r.nom.trim(),
          prenom: r.prenom.trim(),
          classe: r.classe.trim(),
          sexe: r.sexe?.toUpperCase() === "F" ? "F" : "M",
          dateNaissance: r.dateNaissance || "",
          telephone: r.telephone || "",
          adresse: r.adresse || "",
          statut: "actif",
          isBanned: false,
          schoolId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      }

      await batch.commit();

      return {
        success: true,
        dryRun: false,
        imported: count,
        errors,
        message: `${count} eleves importes avec succes.`,
      };
    } catch (error) {
      handleError(error, "Erreur lors de l'import des eleves.");
    }
  });
