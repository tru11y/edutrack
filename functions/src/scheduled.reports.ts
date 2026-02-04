import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import * as ExcelJS from "exceljs";
import { db, admin } from "./firebase";

interface ReportConfig {
  emailTo: string;
  emailFrom: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

interface PaiementData {
  id: string;
  eleveNom?: string;
  classe?: string;
  mois?: string;
  montantTotal?: number;
  montantPaye?: number;
  montantRestant?: number;
  statut?: string;
  createdAt?: { toDate?: () => Date };
}

async function getReportConfig(): Promise<ReportConfig | null> {
  const configDoc = await db.collection("config").doc("reports").get();
  if (!configDoc.exists) return null;
  return configDoc.data() as ReportConfig;
}

function getPreviousMonth(): { mois: string; label: string } {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = String(prev.getMonth() + 1).padStart(2, "0");
  const mois = `${year}-${month}`;
  const label = prev.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { mois, label };
}

async function generateExcelReport(mois: string): Promise<Buffer> {
  const paiementsSnap = await db.collection("paiements")
    .where("mois", "==", mois)
    .get();

  const paiements: PaiementData[] = paiementsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PaiementData[];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduTrack";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Paiements");

  sheet.columns = [
    { header: "ID", key: "id", width: 25 },
    { header: "Élève", key: "eleveNom", width: 30 },
    { header: "Classe", key: "classe", width: 15 },
    { header: "Mois", key: "mois", width: 12 },
    { header: "Montant Total", key: "montantTotal", width: 15 },
    { header: "Montant Payé", key: "montantPaye", width: 15 },
    { header: "Montant Restant", key: "montantRestant", width: 15 },
    { header: "Statut", key: "statut", width: 12 },
    { header: "Date Création", key: "createdAt", width: 20 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const p of paiements) {
    sheet.addRow({
      id: p.id,
      eleveNom: p.eleveNom || "",
      classe: p.classe || "",
      mois: p.mois || "",
      montantTotal: p.montantTotal || 0,
      montantPaye: p.montantPaye || 0,
      montantRestant: p.montantRestant || 0,
      statut: p.statut || "",
      createdAt: p.createdAt?.toDate?.()?.toLocaleDateString("fr-FR") || "",
    });
  }

  const summarySheet = workbook.addWorksheet("Résumé");

  const totalMontant = paiements.reduce((sum, p) => sum + (p.montantTotal || 0), 0);
  const totalPaye = paiements.reduce((sum, p) => sum + (p.montantPaye || 0), 0);
  const totalRestant = paiements.reduce((sum, p) => sum + (p.montantRestant || 0), 0);
  const nbPayes = paiements.filter((p) => p.statut === "paye").length;
  const nbPartiels = paiements.filter((p) => p.statut === "partiel").length;
  const nbImpayes = paiements.filter((p) => p.statut === "impaye").length;

  summarySheet.columns = [
    { header: "Métrique", key: "metric", width: 30 },
    { header: "Valeur", key: "value", width: 20 },
  ];

  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF10B981" },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  summarySheet.addRow({ metric: "Nombre total de paiements", value: paiements.length });
  summarySheet.addRow({ metric: "Montant total attendu", value: `${totalMontant} FCFA` });
  summarySheet.addRow({ metric: "Montant total reçu", value: `${totalPaye} FCFA` });
  summarySheet.addRow({ metric: "Montant restant à percevoir", value: `${totalRestant} FCFA` });
  summarySheet.addRow({ metric: "Paiements complets", value: nbPayes });
  summarySheet.addRow({ metric: "Paiements partiels", value: nbPartiels });
  summarySheet.addRow({ metric: "Impayés", value: nbImpayes });
  summarySheet.addRow({ metric: "Taux de recouvrement", value: `${totalMontant > 0 ? Math.round((totalPaye / totalMontant) * 100) : 0}%` });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function sendEmailWithAttachment(
  config: ReportConfig,
  subject: string,
  body: string,
  attachment: Buffer,
  filename: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  await transporter.sendMail({
    from: config.emailFrom,
    to: config.emailTo,
    subject,
    html: body,
    attachments: [
      {
        filename,
        content: attachment,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}

export const sendMonthlyPaymentReport = functions
  .region("europe-west1")
  .pubsub.schedule("0 8 1 * *")
  .timeZone("Africa/Dakar")
  .onRun(async () => {
    const config = await getReportConfig();

    if (!config || !config.emailTo) {
      console.log("Configuration email non trouvée. Rapport non envoyé.");
      return null;
    }

    const { mois, label } = getPreviousMonth();

    try {
      const excelBuffer = await generateExcelReport(mois);

      const subject = `[EduTrack] Rapport des paiements - ${label}`;
      const body = `
        <h2>Rapport mensuel des paiements</h2>
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint le rapport des paiements pour le mois de <strong>${label}</strong>.</p>
        <p>Ce rapport contient :</p>
        <ul>
          <li>La liste complète des paiements du mois</li>
          <li>Un résumé avec les statistiques de recouvrement</li>
        </ul>
        <p>Cordialement,<br/>EduTrack</p>
      `;
      const filename = `rapport-paiements-${mois}.xlsx`;

      await sendEmailWithAttachment(config, subject, body, excelBuffer, filename);

      await db.collection("audit_logs").add({
        action: "MONTHLY_REPORT_SENT",
        mois,
        emailTo: config.emailTo,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Rapport mensuel envoyé pour ${mois} à ${config.emailTo}`);
      return null;
    } catch (error) {
      console.error("Erreur lors de l'envoi du rapport:", error);

      await db.collection("audit_logs").add({
        action: "MONTHLY_REPORT_FAILED",
        mois,
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });

export const sendPaymentReportManual = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string; emailTo?: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent envoyer des rapports."
      );
    }

    const targetMois = data?.mois || getPreviousMonth().mois;
    const label = new Date(`${targetMois}-01`).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    const config = await getReportConfig();

    if (!config) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Configuration email non trouvée. Configurez d'abord les paramètres SMTP."
      );
    }

    const targetEmail = data?.emailTo || config.emailTo;

    if (!targetEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Adresse email destinataire requise."
      );
    }

    try {
      const excelBuffer = await generateExcelReport(targetMois);

      const subject = `[EduTrack] Rapport des paiements - ${label}`;
      const body = `
        <h2>Rapport mensuel des paiements</h2>
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint le rapport des paiements pour le mois de <strong>${label}</strong>.</p>
        <p>Ce rapport a été généré manuellement par un administrateur.</p>
        <p>Cordialement,<br/>EduTrack</p>
      `;
      const filename = `rapport-paiements-${targetMois}.xlsx`;

      await sendEmailWithAttachment(
        { ...config, emailTo: targetEmail },
        subject,
        body,
        excelBuffer,
        filename
      );

      await db.collection("audit_logs").add({
        action: "MANUAL_REPORT_SENT",
        mois: targetMois,
        emailTo: targetEmail,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: `Rapport envoyé à ${targetEmail}`,
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        `Erreur lors de l'envoi: ${error}`
      );
    }
  });

export const configureReportEmail = functions
  .region("europe-west1")
  .https.onCall(async (data: Partial<ReportConfig>, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent configurer les rapports."
      );
    }

    if (!data?.emailTo) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "L'adresse email destinataire est requise."
      );
    }

    try {
      await db.collection("config").doc("reports").set(
        {
          emailTo: data.emailTo,
          emailFrom: data.emailFrom || "noreply@edutrack.com",
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || "",
          smtpPass: data.smtpPass || "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: context.auth.uid,
        },
        { merge: true }
      );

      await db.collection("audit_logs").add({
        action: "REPORT_CONFIG_UPDATED",
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Configuration enregistrée.",
      };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la sauvegarde de la configuration."
      );
    }
  });
