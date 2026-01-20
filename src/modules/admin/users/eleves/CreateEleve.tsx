import { useState } from "react";
import { createEleve } from "./eleve.service";

export default function CreateEleve() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    classe: "",
    sexe: "M",
    telephone: "",
    parentNom: "",
    parentTelephone: "",
    adresse: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const matricule = `EDU-${new Date().getFullYear()}-${Date.now()}`;

    await createEleve({
      ...form,
      sexe: (form.sexe === "M" || form.sexe === "F" ? form.sexe : "M") as "M" | "F",
      matricule,
      statut: "actif",
      dateInscription: new Date(),
      createdAt: new Date(),
    } as any);

    alert("Élève enregistré");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl">
      <h2 className="text-xl font-bold mb-4">➕ Nouvel élève</h2>

      <input placeholder="Nom" className="input" onChange={e => setForm({ ...form, nom: e.target.value })} />
      <input placeholder="Prénom" className="input" onChange={e => setForm({ ...form, prenom: e.target.value })} />
      <input placeholder="Classe" className="input" onChange={e => setForm({ ...form, classe: e.target.value })} />
      <input placeholder="Téléphone" className="input" onChange={e => setForm({ ...form, telephone: e.target.value })} />
      <input placeholder="Nom du parent" className="input" onChange={e => setForm({ ...form, parentNom: e.target.value })} />
      <input placeholder="Téléphone parent" className="input" onChange={e => setForm({ ...form, parentTelephone: e.target.value })} />

      <button className="mt-4 bg-blue-600 text-white p-2 rounded w-full">
        Enregistrer
      </button>
    </form>
  );
}
