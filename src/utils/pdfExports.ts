import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PresenceRow {
  date: string;
  eleveNom: string;
  classe: string;
  statut: string;
  minutesRetard?: number;
}

interface PaiementRow {
  mois: string;
  eleveNom: string;
  classe: string;
  montantTotal: number;
  montantPaye: number;
  statut: string;
}

interface CreneauRow {
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  classe: string;
  professeurNom: string;
  salle?: string;
}

export function exportPresencesPDF(records: PresenceRow[], title = "Registre des presences") {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title.toUpperCase() + " - EDUTRACK", 14, 20);
  doc.setFontSize(10);
  doc.text(`Genere le : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [["Date", "Eleve", "Classe", "Statut", "Retard (min)"]],
    body: records.map((r) => [r.date, r.eleveNom, r.classe, r.statut, r.minutesRetard?.toString() || "-"]),
    styles: { fontSize: 9 },
  });

  doc.save(`presences_${Date.now()}.pdf`);
}

export function exportPaiementsPDF(records: PaiementRow[], title = "Recap paiements") {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title.toUpperCase() + " - EDUTRACK", 14, 20);
  doc.setFontSize(10);
  doc.text(`Genere le : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [["Mois", "Eleve", "Classe", "Total", "Paye", "Statut"]],
    body: records.map((r) => [
      r.mois,
      r.eleveNom,
      r.classe,
      `${r.montantTotal.toLocaleString()} FCFA`,
      `${r.montantPaye.toLocaleString()} FCFA`,
      r.statut,
    ]),
    styles: { fontSize: 9 },
  });

  doc.save(`paiements_${Date.now()}.pdf`);
}

export function exportEmploiDuTempsPDF(creneaux: CreneauRow[], classe?: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(`EMPLOI DU TEMPS${classe ? ` - ${classe}` : ""} - EDUTRACK`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Genere le : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);

  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const sorted = [...creneaux].sort((a, b) => {
    const ja = jours.indexOf(a.jour);
    const jb = jours.indexOf(b.jour);
    if (ja !== jb) return ja - jb;
    return a.heureDebut.localeCompare(b.heureDebut);
  });

  autoTable(doc, {
    startY: 35,
    head: [["Jour", "Debut", "Fin", "Matiere", "Classe", "Professeur", "Salle"]],
    body: sorted.map((c) => [
      c.jour.charAt(0).toUpperCase() + c.jour.slice(1),
      c.heureDebut,
      c.heureFin,
      c.matiere,
      c.classe,
      c.professeurNom,
      c.salle || "-",
    ]),
    styles: { fontSize: 9 },
  });

  doc.save(`emploi_du_temps_${classe || "all"}_${Date.now()}.pdf`);
}

interface AnalyticsReport {
  type: string;
  attendance?: {
    totalPresences: number;
    totalAbsences: number;
    totalRetards: number;
    tauxPresence: number;
    byClasse: Record<string, { present: number; absent: number; retard: number; taux: number }>;
  };
  grades?: {
    moyenneGenerale: number;
    tauxReussite: number;
    byMatiere: Record<string, { moyenne: number; min: number; max: number; totalNotes: number; tauxReussite: number }>;
  };
  payments?: {
    totalAttendu: number;
    totalPaye: number;
    tauxRecouvrement: number;
    impayes: number;
  };
  correlations?: Array<{ classe: string; tauxPresence: number; moyenneNotes: number }>;
}

export function exportAnalyticsPDF(report: AnalyticsReport) {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(14);
  doc.text(`RAPPORT ANALYTIQUE (${report.type.toUpperCase()}) - EDUTRACK`, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Genere le : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, y);
  y += 12;

  if (report.attendance) {
    doc.setFontSize(12);
    doc.text("PRESENCES", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Taux de presence: ${report.attendance.tauxPresence}%`, 14, y); y += 6;
    doc.text(`Presents: ${report.attendance.totalPresences} | Absents: ${report.attendance.totalAbsences} | Retards: ${report.attendance.totalRetards}`, 14, y); y += 10;

    if (Object.keys(report.attendance.byClasse).length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Classe", "Presents", "Absents", "Retards", "Taux"]],
        body: Object.entries(report.attendance.byClasse).map(([cl, d]) => [cl, d.present, d.absent, d.retard, `${d.taux}%`]),
        styles: { fontSize: 9 },
      });
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
      y += 10;
    }
  }

  if (report.grades) {
    doc.setFontSize(12);
    doc.text("NOTES", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Moyenne generale: ${report.grades.moyenneGenerale}/20 | Taux reussite: ${report.grades.tauxReussite}%`, 14, y); y += 10;

    if (Object.keys(report.grades.byMatiere).length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Matiere", "Moyenne", "Min", "Max", "Taux reussite"]],
        body: Object.entries(report.grades.byMatiere).map(([m, d]) => [m, d.moyenne.toFixed(1), d.min.toFixed(1), d.max.toFixed(1), `${d.tauxReussite}%`]),
        styles: { fontSize: 9 },
      });
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
      y += 10;
    }
  }

  if (report.payments) {
    doc.setFontSize(12);
    doc.text("PAIEMENTS", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Total attendu: ${report.payments.totalAttendu.toLocaleString()} FCFA`, 14, y); y += 6;
    doc.text(`Total paye: ${report.payments.totalPaye.toLocaleString()} FCFA | Recouvrement: ${report.payments.tauxRecouvrement}%`, 14, y); y += 6;
    doc.text(`Impayes: ${report.payments.impayes}`, 14, y);
  }

  doc.save(`analytics_${report.type}_${Date.now()}.pdf`);
}
