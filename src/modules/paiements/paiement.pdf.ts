import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Timestamp } from "firebase/firestore";
import type { Paiement } from "./paiement.types";

function toDate(date: Date | Timestamp | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof (date as Timestamp).toDate === "function") return (date as Timestamp).toDate();
  if (typeof date === "object" && "seconds" in date) return new Date((date as { seconds: number }).seconds * 1000);
  return new Date();
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export interface RecuOptions {
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  adminNom?: string;          // Responsable qui émet le reçu
  generatedByName?: string;   // Nom complet de l'utilisateur qui génère le PDF
  schoolName?: string;
  schoolAdresse?: string;
  schoolTelephone?: string;
  schoolEmail?: string;
}

const BLUE: [number, number, number] = [30, 80, 200];
const BLUE_LIGHT: [number, number, number] = [240, 244, 255];
const GRAY: [number, number, number] = [80, 80, 80];
const DARK: [number, number, number] = [20, 20, 30];

export function exportRecuPaiementPDF(paiement: Paiement, options: RecuOptions): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const schoolName = (options.schoolName || "EduTrack").toUpperCase();
  const invoiceNum = paiement.reference || (paiement.id?.slice(0, 8).toUpperCase()) || "REF-N/A";
  const printDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const payDate = toDate(paiement.datePaiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  // ── Bande en-tête bleue ────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 44, "F");

  // Nom de l'école
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, 14, 14);

  // Sous-infos école
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let subY = 20;
  if (options.schoolAdresse) { doc.text(options.schoolAdresse, 14, subY); subY += 5; }
  const contactLine = [options.schoolTelephone, options.schoolEmail].filter(Boolean).join("  |  ");
  if (contactLine) doc.text(contactLine, 14, subY);

  // Titre reçu (droite)
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE PAIEMENT", W - 14, 14, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Réf : ${invoiceNum}`, W - 14, 23, { align: "right" });
  doc.text(`Émis le : ${printDate}`, W - 14, 29, { align: "right" });

  // ── Bandeau de statut coloré sous l'en-tête ───────────────────────────────
  const statutColors: Record<string, [number, number, number]> = {
    paye:    [22, 163, 74],
    partiel: [202, 138, 4],
    impaye:  [220, 38, 38],
  };
  const statutLabels: Record<string, string> = { paye: "PAYÉ", partiel: "PARTIEL", impaye: "IMPAYÉ" };
  const sc = statutColors[paiement.statut] || GRAY;
  doc.setFillColor(...sc);
  doc.rect(0, 44, W, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  const statutLabel = statutLabels[paiement.statut] || paiement.statut.toUpperCase();
  doc.text(`STATUT : ${statutLabel}`, W / 2, 49.5, { align: "center" });

  // ── Bloc élève ────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE_LIGHT);
  doc.roundedRect(14, 58, W - 28, 32, 3, 3, "F");

  const colW = (W - 28) / 3;
  const fields = [
    { label: "ÉLÈVE", value: `${options.elevePrenom} ${options.eleveNom}`.trim() || "—" },
    { label: "CLASSE", value: options.classe || "—" },
    { label: "MOIS CONCERNÉ", value: paiement.mois || "—" },
  ];
  fields.forEach((f, i) => {
    const x = 22 + i * colW;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text(f.label, x, 67);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(f.value, x, 76);
  });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Date de paiement : ${payDate}`, 22, 85);
  if (paiement.createdByName) {
    doc.text(`Saisi par : ${paiement.createdByName}`, W - 22, 85, { align: "right" });
  }

  // ── Résumé financier ──────────────────────────────────────────────────────
  let y = 100;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE);
  doc.text("DÉTAIL FINANCIER", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Description", "Montant"]],
    body: [
      ["Montant total dû", fmt(paiement.montantTotal)],
      ["Montant payé", fmt(paiement.montantPaye)],
      ["Montant restant", fmt(paiement.montantRestant)],
    ],
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
    },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: DARK },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Historique des versements ─────────────────────────────────────────────
  if (paiement.versements && paiement.versements.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text("HISTORIQUE DES VERSEMENTS", 14, y);
    y += 4;

    const methodLabels: Record<string, string> = {
      especes: "Espèces",
      mobile_money: "Mobile Money",
      virement: "Virement bancaire",
      cheque: "Chèque",
    };

    autoTable(doc, {
      startY: y,
      head: [["N°", "Date", "Montant", "Méthode", "Enregistré par"]],
      body: paiement.versements.map((v, i) => [
        String(i + 1),
        toDate(v.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        fmt(v.montant),
        methodLabels[v.methode] || v.methode,
        v.createdByName || "—",
      ]),
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 32 },
        2: { cellWidth: 42, halign: "right" },
        3: { cellWidth: 42 },
        4: { cellWidth: "auto" },
      },
      headStyles: { fillColor: [50, 110, 220], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: DARK },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    doc.text("Aucun versement enregistré.", 14, y);
    y += 10;
  }

  // ── Espace de signature ───────────────────────────────────────────────────
  // Vérifie qu'on a assez de place, sinon on reste dans les limites
  const sigY = Math.min(y + 6, H - 50);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Cachet à gauche
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Cachet et signature de l'administration :", 14, sigY);
  doc.roundedRect(14, sigY + 3, 70, 22, 2, 2, "S");

  // Émis par à droite
  const emittedBy = options.generatedByName || options.adminNom || "Administration";
  doc.text("Reçu établi par :", W - 84, sigY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(emittedBy, W - 84, sigY + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(printDate, W - 84, sigY + 13);

  // ── Pied de page ──────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, H - 12, W, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${schoolName} — Géré par EduTrack`, W / 2, H - 5, { align: "center" });
  doc.text(`Document généré le ${printDate}`, 14, H - 5);
  doc.text(`Réf : ${invoiceNum}`, W - 14, H - 5, { align: "right" });

  const filename = `recu_${paiement.reference || paiement.id || "paiement"}_${paiement.mois}.pdf`;
  doc.save(filename);
  return filename;
}
