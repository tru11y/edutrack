import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCours } from "./cours.service";
import type { Cours, TypeCours } from "./cours.types";
import toast from "react-hot-toast";

export default function CreateCours() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    classe: "",
    matiere: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    type: "renforcement" as TypeCours,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.classe || !form.matiere || !form.date) {
      toast.error("Champs obligatoires manquants");
      return;
    }

    setLoading(true);
    try {
      const coursData: Omit<Cours, "id" | "statut" | "createdAt" | "updatedAt"> = {
        classe: form.classe,
        matiere: form.matiere,
        date: form.date,
        heureDebut: form.heureDebut,
        heureFin: form.heureFin,
        type: form.type,
      };
      await createCours(coursData as Cours);
      toast.success("Cours créé");
      navigate("/admin/cours");
    } catch {
      toast.error("Erreur création cours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-bold">Nouveau cours</h1>

      <input
        name="matiere"
        placeholder="Matière"
        className="w-full border p-2 rounded"
        onChange={handleChange}
      />
      <input
        name="classe"
        placeholder="Classe"
        className="w-full border p-2 rounded"
        onChange={handleChange}
      />
      <input
        type="date"
        name="date"
        className="w-full border p-2 rounded"
        onChange={handleChange}
      />
      <input
        type="time"
        name="heureDebut"
        className="w-full border p-2 rounded"
        onChange={handleChange}
      />
      <input
        type="time"
        name="heureFin"
        className="w-full border p-2 rounded"
        onChange={handleChange}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-2xl px-6 py-3 font-semibold text-white shadow-lg bg-gradient-to-tr from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 transition text-lg mt-4 disabled:opacity-50"
        style={{ letterSpacing: 1 }}
      >
        {loading ? "Création..." : "Créer"}
      </button>
    </div>
  );
}
