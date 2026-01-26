import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Timestamp } from "firebase/firestore";
import type { Paiement } from "./paiement.types";

function toDate(date: Date | Timestamp): Date {
  if (date instanceof Date) return date;
  // Firestore Timestamp
  if (typeof (date as Timestamp).toDate === "function") {
    return (date as Timestamp).toDate();
  }
  return new Date();
}

interface RecuOptions {
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  adminNom?: string;
}

export function exportRecuPaiementPDF(
  paiement: Paiement,
  options: RecuOptions
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("REÇU DE PAIEMENT — EDUTRACK", 14, 20);

  doc.setFontSize(10);
  doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Mois : ${paiement.mois}`, 14, 36);

  doc.text(
    `Élève : ${options.elevePrenom} ${options.eleveNom}`,
    14,
    46
  );
  doc.text(`Classe : ${options.classe}`, 14, 52);

  doc.text(`Montant total : ${paiement.montantTotal} FCFA`, 14, 62);
  doc.text(`Montant payé : ${paiement.montantPaye} FCFA`, 14, 68);
  doc.text(`Montant restant : ${paiement.montantRestant} FCFA`, 14, 74);

  doc.text(`Statut : ${paiement.statut}`, 14, 84);

  autoTable(doc, {
    startY: 94,
    head: [["Date", "Montant", "Méthode"]],
    body: (paiement.versements || []).map((v) => [
      toDate(v.date).toLocaleDateString(),
      `${v.montant} FCFA`,
      v.methode,
    ]),
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 110;

  doc.text("Signature Administration :", 14, finalY + 20);
  doc.line(80, finalY + 22, 170, finalY + 22);

  if (options.adminNom) {
    doc.text(`Nom : ${options.adminNom}`, 14, finalY + 30);
  }

  doc.text(
    "Ce reçu fait foi de paiement auprès de l’établissement.",
    14,
    finalY + 45
  );

  doc.save(
    `recu_${options.eleveNom}_${paiement.mois}.pdf`
  );
}
