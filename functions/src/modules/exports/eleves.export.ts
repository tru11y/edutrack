import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";
import * as ExcelJS from "exceljs";

export const exportElevesExcel = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe?: string }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("eleves")
        .where("schoolId", "==", schoolId);
      if (data.classe) query = query.where("classe", "==", data.classe);

      const snap = await query.get();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Eleves");

      sheet.columns = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prenom", key: "prenom", width: 20 },
        { header: "Classe", key: "classe", width: 15 },
        { header: "Sexe", key: "sexe", width: 8 },
        { header: "Date Naissance", key: "dateNaissance", width: 15 },
        { header: "Statut", key: "statut", width: 12 },
        { header: "Parent", key: "parent", width: 25 },
        { header: "Telephone Parent", key: "telParent", width: 18 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true };

      snap.docs.forEach((doc) => {
        const d = doc.data();
        const parent = d.parents?.[0];
        sheet.addRow({
          nom: d.nom,
          prenom: d.prenom,
          classe: d.classe,
          sexe: d.sexe,
          dateNaissance: d.dateNaissance || "",
          statut: d.statut,
          parent: parent?.nom || "",
          telParent: parent?.telephone || "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");

      return { success: true, data: base64, filename: `eleves${data.classe ? `_${data.classe}` : ""}.xlsx` };
    } catch (error) {
      handleError(error, "Erreur lors de l'export des eleves.");
    }
  });
