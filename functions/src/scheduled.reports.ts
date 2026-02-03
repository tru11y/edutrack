import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import * as ExcelJS from "exceljs";
import { db, admin } from "./firebase";

// ========================================
// CONFIGURATION
// ========================================

interface ReportConfig {
  emailTo: string;
  emailFrom: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

async function getReportConfig(): Promise<ReportConfig | null> {
  const configDoc = await db.collection("config").doc("reports").get();
  if (!configDoc.exists) return null;
  return configDoc.data() as ReportConfig;
}

// ========================================
// HELPERS
// ========================================

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
  // Récupérer tous les paiements du mois
  const paiementsSnap = await db.collection("paiements")
    .where("mois", "==", mois)
    .get();

  const paiements = paiementsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Créer le workbook Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduTrack";
  workbook.created = new Date();

  // Feuille des paiements
  const sheet = workbook.addWorksheet("Paiements");

  // En-têtes
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

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Ajouter les données
  for (const p of paiements) {
    const data = p as any;
    sheet.addRow({
      id: p.id,
      eleveNom: data.eleveNom || "",
      classe: data.classe || "",
      mois: data.mois || "",
      montantTotal: data.montantTotal || 0,
      montantPaye: data.montantPaye || 0,
      montantRestant: data.montantRestant || 0,
      statut: data.statut || "",
      createdAt: data.createdAt?.toDate?.()?.toLocaleDateString("fr-FR") || "",
    });
  }

  // Feuille de résumé
  const summarySheet = workbook.addWorksheet("Résumé");

  const totalMontant = paiements.reduce((sum, p: any) => sum + (p.montantTotal || 0), 0);
  const totalPaye = paiements.reduce((sum, p: any) => sum + (p.montantPaye || 0), 0);
  const totalRestant = paiements.reduce((sum, p: any) => sum + (p.montantRestant || 0), 0);
  const nbPayes = paiements.filter((p: any) => p.statut === "paye").length;
  const nbPartiels = paiements.filter((p: any) => p.statut === "partiel").length;
  const nbImpayes = paiements.filter((p: any) => p.statut === "impaye").length;

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

  // Générer le buffer
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

// ========================================
// SCHEDULED FUNCTION - Rapport mensuel
// ========================================

/**
 * Envoi automatique du rapport de paiements chaque 1er du mois à 8h
 * Cron: 0 8 1 * * (1er jour du mois à 8h00)
 */
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
      // Générer le rapport Excel
      const excelBuffer = await generateExcelReport(mois);

      // Préparer l'email
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

      // Envoyer l'email
      await sendEmailWithAttachment(config, subject, body, excelBuffer, filename);

      // Log de l'envoi
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

      // Log de l'erreur
      await db.collection("audit_logs").add({
        action: "MONTHLY_REPORT_FAILED",
        mois,
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });

// ========================================
// CALLABLE FUNCTION - Envoi manuel
// ========================================

/**
 * Permet à un admin d'envoyer manuellement le rapport
 */
export const sendPaymentReportManual = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }

    // Vérifier admin
    const userDoc = await db.collection("users").doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent envoyer des rapports."
      );
    }

    const { mois, emailTo } = data as { mois?: string; emailTo?: string };

    // Utiliser le mois précédent par défaut
    const targetMois = mois || getPreviousMonth().mois;
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

    const targetEmail = emailTo || config.emailTo;

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

      // Log
      await db.collection("audit_logs").add({
        action: "MANUAL_REPORT_SENT",
        mois: targetMois,
        emailTo: targetEmail,
        performedBy: auth.uid,
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

// ========================================
// CALLABLE FUNCTION - Configurer email
// ========================================

/**
 * Configurer les paramètres d'envoi email - ADMIN uniquement
 */
export const configureReportEmail = functions
  .region("europe-west1")
  .https.onCall(async (request) => {
    const { data, auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }

    // Vérifier admin
    const userDoc = await db.collection("users").doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent configurer les rapports."
      );
    }

    const config = data as Partial<ReportConfig>;

    if (!config.emailTo) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "L'adresse email destinataire est requise."
      );
    }

    try {
      await db.collection("config").doc("reports").set(
        {
          emailTo: config.emailTo,
          emailFrom: config.emailFrom || "noreply@edutrack.com",
          smtpHost: config.smtpHost || "",
          smtpPort: config.smtpPort || 587,
          smtpUser: config.smtpUser || "",
          smtpPass: config.smtpPass || "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: auth.uid,
        },
        { merge: true }
      );

      // Log
      await db.collection("audit_logs").add({
        action: "REPORT_CONFIG_UPDATED",
        performedBy: auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Configuration enregistrée.",
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la sauvegarde de la configuration."
      );
    }
  });
