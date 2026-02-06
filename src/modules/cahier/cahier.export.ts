import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CahierExportRow {
  date: string;
  classe: string;
  coursId: string;
  profId: string;
  eleves?: string[];
  contenu?: string;
  devoirs?: string;
}

export function exportCahierToPDF(entries: CahierExportRow[], options?: {
  titre?: string;
  periode?: string;
}) {
  const doc = new jsPDF();

  const titre = options?.titre || "Cahier de texte";
  const periode = options?.periode || "";

  doc.setFontSize(14);
  doc.text(titre, 14, 15);

  if (periode) {
    doc.setFontSize(10);
    doc.text(periode, 14, 22);
  }

  const rows = entries.map((e) => [
    e.date,
    e.classe,
    e.coursId,
    e.profId,
    (e.eleves?.length || 0).toString(),
    e.contenu || "",
    e.devoirs || "",
  ]);

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "Date",
        "Classe",
        "Cours",
        "Prof",
        "Élèves",
        "Contenu",
        "Devoirs",
      ],
    ],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "top",
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: 255,
    },
    columnStyles: {
      5: { cellWidth: 60 },
      6: { cellWidth: 60 },
    },
  });

  doc.save("cahier-texte.pdf");
}
