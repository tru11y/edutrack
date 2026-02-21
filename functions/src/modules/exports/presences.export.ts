import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";
import * as ExcelJS from "exceljs";

export const exportPresencesExcel = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe?: string; mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const appelsSnap = await db.collectionGroup("appels")
        .where("schoolId", "==", schoolId).get();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Presences");

      sheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Eleve ID", key: "eleveId", width: 20 },
        { header: "Classe", key: "classe", width: 15 },
        { header: "Statut", key: "statut", width: 12 },
        { header: "Minutes Retard", key: "minutesRetard", width: 15 },
      ];

      sheet.getRow(1).font = { bold: true };

      for (const doc of appelsSnap.docs) {
        const d = doc.data();
        if (data.classe && d.classe !== data.classe) continue;
        if (data.mois && !d.date?.startsWith(data.mois)) continue;

        sheet.addRow({
          date: d.date || "",
          eleveId: d.eleveId || "",
          classe: d.classe || "",
          statut: d.statut || "",
          minutesRetard: d.minutesRetard || 0,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");

      return { success: true, data: base64, filename: `presences${data.classe ? `_${data.classe}` : ""}.xlsx` };
    } catch (error) {
      handleError(error, "Erreur lors de l'export des presences.");
    }
  });
