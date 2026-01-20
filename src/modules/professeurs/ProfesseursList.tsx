import { useEffect, useState } from "react";
import { getAllProfesseurs } from "./professeur.service";
import type { Professeur } from "./professeur.types";
import { Table } from "../../components/ui/Table";

export default function ProfesseursList() {
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProfesseurs().then((data) => {
      setProfs(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">👨‍🏫 Professeurs</h1>

      {profs.length === 0 ? (
        <p className="text-gray-500">Aucun professeur enregistré</p>
      ) : (
        <Table headers={["Nom", "Matière", "Statut"]}>
          {profs.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">
                {p.prenom} {p.nom}
              </td>
              <td className="border p-2">{p.matiere}</td>
              <td className="border p-2">{p.statut}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
