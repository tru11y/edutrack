import { useEffect, useState } from "react";
import { getAllPaiements } from "./paiement.service";

export default function AdminPaiementsList() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPaiements().then((d) => {
      setPaiements(d);
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    alert("Export PDF en construction");
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">💰 Registre des paiements</h1>

        <button
          onClick={handleExport}
          className="bg-black text-white px-3 py-2 rounded"
        >
          📄 Export PDF
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Mois</th>
            <th className="p-2 border">Élève</th>
            <th className="p-2 border">Classe</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Payé</th>
            <th className="p-2 border">Restant</th>
            <th className="p-2 border">Statut</th>
          </tr>
        </thead>

        <tbody>
          {paiements.map((p) => (
            <tr key={p.id}>
              <td className="p-2 border">{p.mois}</td>
              <td className="p-2 border">
                {p.eleveNom} {p.elevePrenom}
              </td>
              <td className="p-2 border">{p.classe}</td>
              <td className="p-2 border">
                {p.montantTotal.toLocaleString()} FCFA
              </td>
              <td className="p-2 border">
                {p.montantPaye.toLocaleString()} FCFA
              </td>
              <td className="p-2 border">
                {p.montantRestant.toLocaleString()} FCFA
              </td>
              <td className="p-2 border">{p.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
