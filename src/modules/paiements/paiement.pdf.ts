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

interface RecuOptions {
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  adminNom?: string;
  schoolName?: string;
}

export function exportRecuPaiementPDF(paiement: Paiement, options: RecuOptions) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const schoolName = options.schoolName || "EduTrack";
  const invoiceNum = paiement.reference || paiement.id?.slice(0, 8).toUpperCase() || "FACTURE";
  const printDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const payDate = toDate(paiement.datePaiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); // primary blue
  doc.rect(0, 0, W, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName.toUpperCase(), 14, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Système de gestion scolaire EduTrack", 14, 24);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE PAIEMENT", W - 14, 18, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Réf : ${invoiceNum}`, W - 14, 27, { align: "right" });
  doc.text(`Date : ${printDate}`, W - 14, 33, { align: "right" });

  // Reset text color
  doc.setTextColor(30, 30, 30);

  // ── Student info block ────────────────────────────────────────────────────
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, 50, W - 28, 36, 3, 3, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("ÉLÈVE", 22, 60);
  doc.text("CLASSE", 90, 60);
  doc.text("MOIS CONCERNÉ", 140, 60);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text(`${options.elevePrenom} ${options.eleveNom}`, 22, 70);
  doc.text(options.classe || "—", 90, 70);
  doc.text(paiement.mois || "—", 140, 70);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date de paiement : ${payDate}`, 22, 80);

  // ── Financial summary ────────────────────────────────────────────────────
  let y = 100;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text("DÉTAIL DU PAIEMENT", 14, y);
  y += 8;

  // Summary rows
  const rows: [string, string, string][] = [
    ["Montant total dû", `${paiement.montantTotal.toLocaleString("fr-FR")} FCFA`, ""],
    ["Montant payé", `${paiement.montantPaye.toLocaleString("fr-FR")} FCFA`, ""],
    ["Montant restant", `${paiement.montantRestant.toLocaleString("fr-FR")} FCFA`, ""],
  ];

  const statutLabel: Record<string, string> = { paye: "PAYÉ", partiel: "PARTIEL", impaye: "IMPAYÉ" };
  const statutColors: Record<string, [number, number, number]> = {
    paye: [22, 163, 74],
    partiel: [234, 179, 8],
    impaye: [220, 38, 38],
  };

  autoTable(doc, {
    startY: y,
    head: [["Description", "Montant", ""]],
    body: rows,
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: "right" },
      2: { cellWidth: 20 },
    },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Statut badge
  const sc = statutColors[paiement.statut] || [100, 100, 100];
  doc.setFillColor(...sc);
  doc.roundedRect(14, y, 50, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(statutLabel[paiement.statut] || paiement.statut.toUpperCase(), 39, y + 8.5, { align: "center" });
  doc.setTextColor(30, 30, 30);

  y += 20;

  // ── Versements table ─────────────────────────────────────────────────────
  if (paiement.versements && paiement.versements.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("HISTORIQUE DES VERSEMENTS", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Montant", "Méthode de paiement"]],
      body: paiement.versements.map((v) => [
        toDate(v.date).toLocaleDateString("fr-FR"),
        `${v.montant.toLocaleString("fr-FR")} FCFA`,
        v.methode === "especes" ? "Espèces"
          : v.methode === "mobile_money" ? "Mobile Money"
          : v.methode === "virement" ? "Virement bancaire"
          : v.methode === "cheque" ? "Chèque"
          : v.methode,
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Signature ────────────────────────────────────────────────────────────
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Signature et cachet de l'administration :", 14, y);
  doc.line(14, y + 20, 90, y + 20);
  if (options.adminNom) {
    doc.text(`Établi par : ${options.adminNom}`, 14, y + 28);
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(37, 99, 235);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${schoolName} — Géré par EduTrack`, W / 2, pageH - 5, { align: "center" });
  doc.text(`Document généré le ${printDate}`, 14, pageH - 5);

  doc.save(`recu_${options.eleveNom}_${paiement.mois}.pdf`);
}
