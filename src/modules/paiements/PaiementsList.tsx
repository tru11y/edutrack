import { useEffect, useState } from "react";
import { getAllPaiements } from "./paiement.service";

export default function PaiementsList() {
  const [paiements, setPaiements] = useState<any[]>([]);

  useEffect(() => {
    getAllPaiements().then(setPaiements);
  }, []);

  return (
    <div>
      <h1>Paiements</h1>

      <table>
        <thead>
          <tr>
            <th>Élève</th>
            <th>Mois</th>
            <th>Total</th>
            <th>Payé</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((p) => (
            <tr key={p.id}>
              <td>{p.eleveNom}</td>
              <td>{p.mois}</td>
              <td>{p.montantTotal}</td>
              <td>{p.montantPaye}</td>
              <td>{p.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
