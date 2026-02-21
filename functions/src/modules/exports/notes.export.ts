import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";
import * as ExcelJS from "exceljs";

export const exportNotesExcel = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe?: string; trimestre?: number }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Get evaluations
      let evalQuery: FirebaseFirestore.Query = db.collection("evaluations")
        .where("schoolId", "==", schoolId);
      if (data.classe) evalQuery = evalQuery.where("classe", "==", data.classe);
      if (data.trimestre) evalQuery = evalQuery.where("trimestre", "==", data.trimestre);

      const evalsSnap = await evalQuery.get();
      const evalIds = evalsSnap.docs.map((d) => d.id);
      const evalMap: Record<string, FirebaseFirestore.DocumentData> = {};
      evalsSnap.docs.forEach((d) => { evalMap[d.id] = d.data(); });

      // Get notes
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Notes");

      sheet.columns = [
        { header: "Eleve", key: "eleveNom", width: 25 },
        { header: "Evaluation", key: "titre", width: 25 },
        { header: "Matiere", key: "matiere", width: 20 },
        { header: "Classe", key: "classe", width: 15 },
        { header: "Type", key: "type", width: 12 },
        { header: "Note", key: "note", width: 10 },
        { header: "Max", key: "maxNote", width: 10 },
        { header: "Coef", key: "coefficient", width: 8 },
        { header: "Absent", key: "absence", width: 8 },
        { header: "Commentaire", key: "commentaire", width: 30 },
      ];

      sheet.getRow(1).font = { bold: true };

      for (const evalId of evalIds) {
        const notesSnap = await db.collection("notes")
          .where("evaluationId", "==", evalId)
          .get();

        const ev = evalMap[evalId];
        for (const doc of notesSnap.docs) {
          const d = doc.data();
          sheet.addRow({
            eleveNom: d.eleveNom || "",
            titre: ev.titre || "",
            matiere: ev.matiere || "",
            classe: ev.classe || "",
            type: ev.type || "",
            note: d.note || 0,
            maxNote: ev.maxNote || 20,
            coefficient: ev.coefficient || 1,
            absence: d.absence ? "Oui" : "Non",
            commentaire: d.commentaire || "",
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");

      return { success: true, data: base64, filename: `notes${data.classe ? `_${data.classe}` : ""}.xlsx` };
    } catch (error) {
      handleError(error, "Erreur lors de l'export des notes.");
    }
  });
