import { useEffect, useState } from "react";
import { getAllEleves } from "../eleves/eleve.service";
import { exclureEleve } from "./discipline.service";
import { useAuth } from "../../context/AuthContext";
import type { Eleve } from "../eleves/eleve.types";

export default function ExclureEleve() {
  const { user } = useAuth();

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [selected, setSelected] = useState("");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllEleves().then((d) => {
      setEleves(d.filter((e) => e.statut === "actif"));
    });
  }, []);

  const handleExclude = async () => {
    if (!selected || !motif || !user?.professeurId) return;

    const eleve = eleves.find((e) => e.id === selected);
    if (!eleve) return;

    try {
      setLoading(true);

      await exclureEleve(
        eleve.id,
        motif,
        user.email || "Professeur"
      );

      alert("Élève exclu");
      setSelected("");
      setMotif("");
    } catch {
      alert("Erreur exclusion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded border">
      <h2 className="font-semibold text-lg">🚫 Exclure un élève</h2>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="">— Choisir un élève —</option>
        {eleves.map((e) => (
          <option key={e.id} value={e.id}>
            {e.prenom} {e.nom} — {e.classe}
          </option>
        ))}
      </select>

      <textarea
        placeholder="Motif de l’exclusion"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleExclude}
        disabled={loading || !selected || !motif}
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Exclusion..." : "🚫 Exclure"}
      </button>
    </div>
  );
}
