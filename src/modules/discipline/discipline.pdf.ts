import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DisciplineRecord } from "./discipline.types";

export function exportDisciplinePDF(records: DisciplineRecord[]) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("REGISTRE DISCIPLINAIRE — EDUTRACK", 14, 20);

  doc.setFontSize(10);
  doc.text(
    `Généré le : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    14,
    28
  );

  const rows = records.map((r) => [
    r.createdAt?.toDate?.().toLocaleDateString() || "-",
    `${r.elevePrenom} ${r.eleveNom}`,
    r.classe,
    r.type,
    r.description,
    r.isSystem ? "Système" : r.profNom || "Prof",
  ]);

  autoTable(doc, {
    startY: 35,
    head: [
      ["Date", "Élève", "Classe", "Type", "Description", "Source"],
    ],
    body: rows,
    styles: {
      fontSize: 9,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 260;

  doc.text("Signature Administration :", 14, finalY + 20);
  doc.line(60, finalY + 22, 140, finalY + 22);

  doc.save(`registre_disciplinaire_${Date.now()}.pdf`);
}
