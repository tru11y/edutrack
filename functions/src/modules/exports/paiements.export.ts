import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";
import * as ExcelJS from "exceljs";

export const exportPaiementsExcel = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("paiements")
        .where("schoolId", "==", schoolId);
      if (data.mois) query = query.where("mois", "==", data.mois);

      const snap = await query.get();

      // Get eleve names
      const elevesSnap = await db.collection("eleves")
        .where("schoolId", "==", schoolId).get();
      const eleveMap: Record<string, string> = {};
      elevesSnap.docs.forEach((d) => {
        const ed = d.data();
        eleveMap[d.id] = `${ed.prenom} ${ed.nom}`;
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Paiements");

      sheet.columns = [
        { header: "Eleve", key: "eleveNom", width: 25 },
        { header: "Mois", key: "mois", width: 12 },
        { header: "Montant Total", key: "montantTotal", width: 15 },
        { header: "Montant Paye", key: "montantPaye", width: 15 },
        { header: "Reste", key: "reste", width: 15 },
        { header: "Statut", key: "statut", width: 12 },
        { header: "Date Paiement", key: "datePaiement", width: 15 },
      ];

      sheet.getRow(1).font = { bold: true };

      snap.docs.forEach((doc) => {
        const d = doc.data();
        const reste = (d.montantTotal || 0) - (d.montantPaye || 0);
        let statut = "Impaye";
        if (reste <= 0) statut = "Paye";
        else if (d.montantPaye > 0) statut = "Partiel";

        sheet.addRow({
          eleveNom: eleveMap[d.eleveId] || d.eleveId,
          mois: d.mois || "",
          montantTotal: d.montantTotal || 0,
          montantPaye: d.montantPaye || 0,
          reste,
          statut,
          datePaiement: d.datePaiement || "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");

      return { success: true, data: base64, filename: `paiements${data.mois ? `_${data.mois}` : ""}.xlsx` };
    } catch (error) {
      handleError(error, "Erreur lors de l'export des paiements.");
    }
  });
