import { useState, type FormEvent } from "react";
import { createEleve } from "./eleve.service";
import type { Eleve } from "./eleve.types";

export default function CreateEleve() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    classe: "",
    sexe: "M" as "M" | "F",
    telephone: "",
    parentNom: "",
    parentTelephone: "",
    adresse: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const matricule = `EDU-${new Date().getFullYear()}-${Date.now()}`;

    const eleveData: Eleve = {
      nom: form.nom,
      prenom: form.prenom,
      classe: form.classe,
      sexe: form.sexe,
      telephone: form.telephone,
      parentNom: form.parentNom,
      parentTelephone: form.parentTelephone,
      adresse: form.adresse,
      matricule,
      statut: "actif",
      dateInscription: new Date(),
      createdAt: new Date(),
    };

    await createEleve(eleveData);
    alert("Élève enregistré");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl">
      <h2 className="text-xl font-bold mb-4">Nouvel élève</h2>

      <input
        placeholder="Nom"
        className="input"
        value={form.nom}
        onChange={e => setForm({ ...form, nom: e.target.value })}
      />
      <input
        placeholder="Prénom"
        className="input"
        value={form.prenom}
        onChange={e => setForm({ ...form, prenom: e.target.value })}
      />
      <input
        placeholder="Classe"
        className="input"
        value={form.classe}
        onChange={e => setForm({ ...form, classe: e.target.value })}
      />
      <input
        placeholder="Téléphone"
        className="input"
        value={form.telephone}
        onChange={e => setForm({ ...form, telephone: e.target.value })}
      />
      <input
        placeholder="Nom du parent"
        className="input"
        value={form.parentNom}
        onChange={e => setForm({ ...form, parentNom: e.target.value })}
      />
      <input
        placeholder="Téléphone parent"
        className="input"
        value={form.parentTelephone}
        onChange={e => setForm({ ...form, parentTelephone: e.target.value })}
      />

      <button type="submit" className="mt-4 bg-blue-600 text-white p-2 rounded w-full">
        Enregistrer
      </button>
    </form>
  );
}
