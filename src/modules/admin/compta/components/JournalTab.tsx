import type { Paiement } from "../../../paiements/paiement.types";
import type { Depense, Salaire } from "../compta.types";
import type { useTheme } from "../../../../context/ThemeContext";

interface MouvementEntry {
  date: string;
  libelle: string;
  type: "entree" | "sortie";
  categorie: string;
  montant: number;
}

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function formatDate(d: string): string {
  if (!d) return "-";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function buildJournal(paiements: Paiement[], depenses: Depense[], salaires: Salaire[]): MouvementEntry[] {
  const entries: MouvementEntry[] = [];

  for (const p of paiements) {
    if (p.montantPaye > 0) {
      entries.push({
        date: p.mois + "-01",
        libelle: `Paiement ${p.eleveNom}${p.reference ? ` (${p.reference})` : ""}`,
        type: "entree",
        categorie: "Scolarite",
        montant: p.montantPaye,
      });
    }
  }

  for (const d of depenses) {
    entries.push({
      date: d.date,
      libelle: d.libelle,
      type: "sortie",
      categorie: d.categorie,
      montant: d.montant,
    });
  }

  for (const s of salaires) {
    if (s.statut === "paye") {
      entries.push({
        date: s.datePaiement || s.mois + "-01",
        libelle: `Salaire ${s.profNom}`,
        type: "sortie",
        categorie: "Salaire",
        montant: s.montant,
      });
    }
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

export default function JournalTab({
  paiements,
  depenses,
  salaires,
  colors,
}: {
  paiements: Paiement[];
  depenses: Depense[];
  salaires: Salaire[];
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const journal = buildJournal(paiements, depenses, salaires);

  const totalEntrees = journal.filter((e) => e.type === "entree").reduce((s, e) => s + e.montant, 0);
  const totalSorties = journal.filter((e) => e.type === "sortie").reduce((s, e) => s + e.montant, 0);

  if (journal.length === 0) {
    return (
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun mouvement pour ce mois</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Entrees: <strong style={{ color: colors.success }}>{formatMontant(totalEntrees)}</strong>
        </span>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Sorties: <strong style={{ color: colors.danger }}>{formatMontant(totalSorties)}</strong>
        </span>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          Solde: <strong style={{ color: totalEntrees - totalSorties >= 0 ? colors.success : colors.danger }}>
            {formatMontant(totalEntrees - totalSorties)}
          </strong>
        </span>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Libelle</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Categorie</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Entree</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>Sortie</th>
              </tr>
            </thead>
            <tbody>
              {journal.map((entry, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>{formatDate(entry.date)}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{entry.libelle}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, background: entry.type === "entree" ? colors.successBg : colors.dangerBg, color: entry.type === "entree" ? colors.success : colors.danger }}>
                      {entry.categorie}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.success, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                    {entry.type === "entree" ? formatMontant(entry.montant) : ""}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: colors.danger, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                    {entry.type === "sortie" ? formatMontant(entry.montant) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
