import { useEffect, useState } from "react";
import { getAllEleves } from "./eleve.service";
import { Link } from "react-router-dom";

export default function ElevesList() {
  const [eleves, setEleves] = useState<any[]>([]);

  useEffect(() => {
    getAllEleves().then(setEleves);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">🎓 Élèves</h1>

      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-200">
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Classe</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {eleves.map(e => (
            <tr key={e.id} className="border-t">
              <td>{e.matricule}</td>
              <td>{e.nom} {e.prenom}</td>
              <td>{e.classe}</td>
              <td>{e.statut}</td>
              <td>
                <Link to={`/admin/eleves/${e.id}`} className="text-blue-600">
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
