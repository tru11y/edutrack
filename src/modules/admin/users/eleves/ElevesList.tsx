import { useEffect, useState } from "react";
import { getAllEleves } from "./eleve.service";
import { Link } from "react-router-dom";
import { useTheme } from "../../../../context/ThemeContext";
import type { Eleve } from "./eleve.types";

export default function ElevesList() {
  const { colors } = useTheme();
  const [eleves, setEleves] = useState<Eleve[]>([]);

  useEffect(() => {
    getAllEleves().then(setEleves);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: colors.text }}>🎓 Élèves</h1>

      <table className="w-full shadow rounded" style={{ background: colors.bgCard }}>
        <thead style={{ background: colors.bgSecondary }}>
          <tr>
            <th className="p-2" style={{ color: colors.text }}>Matricule</th>
            <th className="p-2" style={{ color: colors.text }}>Nom</th>
            <th className="p-2" style={{ color: colors.text }}>Classe</th>
            <th className="p-2" style={{ color: colors.text }}>Statut</th>
            <th className="p-2" style={{ color: colors.text }}>Paiement</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {eleves.map(e => (
            <tr key={e.id} style={{ borderTop: `1px solid ${colors.border}` }}>
              <td className="p-2" style={{ color: colors.text }}>{e.matricule}</td>
              <td className="p-2" style={{ color: colors.text }}>{e.nom} {e.prenom}</td>
              <td className="p-2" style={{ color: colors.text }}>{e.classe}</td>
              <td className="p-2" style={{ color: colors.text }}>{e.statut}</td>
              <td className="p-2">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: e.statutPaiementMensuel === "a_jour" ? colors.successBg : colors.dangerBg,
                    color: e.statutPaiementMensuel === "a_jour" ? colors.success : colors.danger
                  }}
                >
                  {e.statutPaiementMensuel === "a_jour" ? "À jour" : "Non à jour"}
                </span>
              </td>
              <td className="p-2">
                <Link to={`/admin/eleves/${e.id}`} style={{ color: colors.primary }}>
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
