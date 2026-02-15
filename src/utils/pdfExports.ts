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
