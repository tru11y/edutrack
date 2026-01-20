import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPaiementsByEleve } from "../paiements/paiement.service";
import { exportRecuPaiementPDF } from "../paiements/paiement.pdf";

export default function ParentPaiements() {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.eleveId) return;

    getPaiementsByEleve(user.eleveId).then((p) => {
      setPaiements(p);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">
        💰 Paiements & reçus
      </h1>

      {paiements.length === 0 ? (
        <p className="text-gray-500">
          Aucun paiement
        </p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Mois</th>
              <th className="border p-2">Payé</th>
              <th className="border p-2">Restant</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Reçu</th>
            </tr>
          </thead>

          <tbody>
            {paiements.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.mois}</td>
                <td className="border p-2">{p.montantPaye}</td>
                <td className="border p-2">{p.montantRestant}</td>
                <td className="border p-2">{p.statut}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      exportRecuPaiementPDF(p, {
                        eleveNom: user?.email?.split("@")[0] || "Élève",
                        elevePrenom: "",
                        classe: "N/A",
                      })
                    }
                    className="text-blue-600 underline"
                  >
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
