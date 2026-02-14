import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Bulletin } from "./notes.types";

export function exportBulletinPDF(bulletin: Bulletin, eleveNom: string) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text("BULLETIN DE NOTES — EDUTRACK", 14, 20);

  doc.setFontSize(11);
  doc.text(`Eleve : ${eleveNom}`, 14, 32);
  doc.text(`Classe : ${bulletin.classe}`, 14, 38);
  doc.text(`Trimestre : ${bulletin.trimestre}`, 14, 44);
  doc.text(`Annee scolaire : ${bulletin.anneeScolaire}`, 14, 50);

  // Moyennes table
  const matieres = Object.entries(bulletin.moyennesMatiere || {}).sort(([a], [b]) => a.localeCompare(b));

  autoTable(doc, {
    startY: 58,
    head: [["Matiere", "Moyenne /20"]],
    body: matieres.map(([matiere, moy]) => [matiere, moy.toFixed(2)]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 80;

  // Summary
  doc.setFontSize(12);
  doc.text(`Moyenne Generale : ${bulletin.moyenneGenerale}/20`, 14, finalY + 15);
  if (bulletin.rang > 0) {
    doc.text(`Rang : ${bulletin.rang}/${bulletin.totalEleves}`, 14, finalY + 23);
  }

  doc.setFontSize(10);
  doc.text(`Absences : ${bulletin.absencesTotal}`, 14, finalY + 35);
  doc.text(`Retards : ${bulletin.retardsTotal}`, 14, finalY + 42);

  if (bulletin.appreciationGenerale) {
    doc.text(`Appreciation : ${bulletin.appreciationGenerale}`, 14, finalY + 54);
  }

  // Signatures
  const sigY = finalY + 70;
  doc.text("Signature du Professeur Principal :", 14, sigY);
  doc.line(80, sigY + 2, 160, sigY + 2);

  doc.text("Signature du Directeur :", 14, sigY + 15);
  doc.line(65, sigY + 17, 145, sigY + 17);

  doc.text("Signature du Parent :", 14, sigY + 30);
  doc.line(60, sigY + 32, 140, sigY + 32);

  doc.save(`bulletin_${eleveNom.replace(/\s+/g, "_")}_T${bulletin.trimestre}_${bulletin.anneeScolaire}.pdf`);
}
