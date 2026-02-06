import { useEffect, useState } from "react";
import { getAllPaiements } from "./paiement.service";
import { useTheme } from "../../context/ThemeContext";
import type { Paiement } from "./paiement.types";

export default function PaiementsList() {
  const { colors } = useTheme();
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  useEffect(() => {
    getAllPaiements().then(setPaiements);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Paiements</h1>

      <table className="w-full" style={{ border: `1px solid ${colors.border}` }}>
        <thead style={{ background: colors.bgSecondary }}>
          <tr>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Élève</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Mois</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Total</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Payé</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((p) => (
            <tr key={p.id} style={{ background: colors.bgCard }}>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.eleveNom}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.mois}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.montantTotal}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{p.montantPaye}</td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}` }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg,
                  color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger
                }}>
                  {p.statut}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
