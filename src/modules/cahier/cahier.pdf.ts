import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CahierEntry } from "./cahier.types";

export function exportCahierTextePDF(cahier: CahierEntry) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("CAHIER DE TEXTE — EDUTRACK", 14, 20);

  doc.setFontSize(10);
  doc.text(`Date : ${cahier.date}`, 14, 30);
  doc.text(`Classe : ${cahier.classe}`, 14, 36);
  doc.text(`Professeur : ${cahier.profNom}`, 14, 42);

  doc.setFontSize(12);
  doc.text("Contenu du cours :", 14, 54);

  const contenuLines = doc.splitTextToSize(
    cahier.contenu || "-",
    180
  );
  doc.text(contenuLines, 14, 62);

  const afterContenuY =
    62 + contenuLines.length * 6 + 10;

  doc.text("Devoirs :", 14, afterContenuY);
  const devoirsLines = doc.splitTextToSize(
    cahier.devoirs || "Aucun",
    180
  );
  doc.text(devoirsLines, 14, afterContenuY + 8);

  const afterDevoirsY =
    afterContenuY + 8 + devoirsLines.length * 6 + 10;

  autoTable(doc, {
    startY: afterDevoirsY,
    head: [["Élèves présents"]],
    body: cahier.eleves.map((e: string) => [e]),
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || afterDevoirsY;

  doc.text("Signature Professeur :", 14, finalY + 20);
  doc.line(70, finalY + 22, 150, finalY + 22);

  doc.text("Signature Administration :", 14, finalY + 35);
  doc.line(80, finalY + 37, 170, finalY + 37);

  doc.save(`cahier_texte_${cahier.classe}_${cahier.date}.pdf`);
}
