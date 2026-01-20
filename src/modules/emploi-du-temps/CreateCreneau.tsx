import { useState } from "react";
import { createCreneau } from "./emploi.service";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function CreateCreneau() {
  const [form, setForm] = useState<any>({
    jour: "Lundi",
    heureDebut: "",
    heureFin: "",
    classe: "",
    matiere: "",
    professeurId: "",
    type: "renforcement",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await createCreneau(form);
    alert("Créneau ajouté");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl">
      <h2 className="text-xl font-bold mb-4">➕ Nouveau créneau</h2>

      <select className="input" onChange={e => setForm({ ...form, jour: e.target.value })}>
        {JOURS.map(j => <option key={j}>{j}</option>)}
      </select>

      <div className="flex gap-2">
        <input type="time" className="input" onChange={e => setForm({ ...form, heureDebut: e.target.value })} />
        <input type="time" className="input" onChange={e => setForm({ ...form, heureFin: e.target.value })} />
      </div>

      <input className="input" placeholder="Classe" onChange={e => setForm({ ...form, classe: e.target.value })} />
      <input className="input" placeholder="Matière" onChange={e => setForm({ ...form, matiere: e.target.value })} />
      <input className="input" placeholder="ID Professeur" onChange={e => setForm({ ...form, professeurId: e.target.value })} />

      <select className="input" onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="renforcement">Renforcement</option>
        <option value="soir">Cours du soir</option>
      </select>

      <button className="mt-4 bg-blue-600 text-white p-2 rounded w-full">
        Enregistrer
      </button>
    </form>
  );
}
