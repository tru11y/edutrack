import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCours } from "./cours.service";
import toast from "react-hot-toast";

export default function CreateCours() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    classe: "",
    matiere: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    type: "renforcement" as const,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.classe || !form.matiere || !form.date) {
      toast.error("Champs obligatoires manquants");
      return;
    }

    setLoading(true);
    try {
      await createCours(form as any);
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
      <h1 className="text-xl font-bold">➕ Nouveau cours</h1>

      <input name="matiere" placeholder="Matière" onChange={handleChange} />
      <input name="classe" placeholder="Classe" onChange={handleChange} />
      <input type="date" name="date" onChange={handleChange} />
      <input type="time" name="heureDebut" onChange={handleChange} />
      <input type="time" name="heureFin" onChange={handleChange} />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Création…" : "Créer"}
      </button>
    </div>
  );
}
