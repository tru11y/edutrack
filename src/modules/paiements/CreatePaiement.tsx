import { useState } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

// Fonction d'ajout de versement - intégrée depuis paiement.service
async function ajouterVersement(paiementId: string, versement: any, paiement: any) {
  const ref = doc(db, "paiements", paiementId);
  const versements = paiement.versements ?? [];
  await updateDoc(ref, { versements: [...versements, versement] });
}

export default function CreatePaiement({ paiement }: any) {
  const [montant, setMontant] = useState(0);
  const [methode, setMethode] = useState("especes");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    await ajouterVersement(
      paiement.id,
      {
        date: new Date(),
        montant,
        methode,
      },
      paiement
    );

    alert("Paiement enregistré");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded">
      <h4 className="font-semibold mb-2">💳 Nouveau versement</h4>

      <input
        type="number"
        className="input"
        placeholder="Montant"
        onChange={(e) => setMontant(Number(e.target.value))}
      />

      <select className="input" onChange={(e) => setMethode(e.target.value)}>
        <option value="especes">Espèces</option>
        <option value="mobile_money">Mobile Money</option>
        <option value="virement">Virement</option>
        <option value="cheque">Chèque</option>
      </select>

      <button className="mt-2 bg-green-600 text-white p-2 rounded w-full">
        Enregistrer
      </button>
    </form>
  );
}
