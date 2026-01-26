import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCoursById, assignProfesseurToCours } from "./cours.service";
import { getAllProfesseurs } from "../professeurs/professeur.service";
import type { Cours } from "./cours.types";
import type { Professeur } from "../professeurs/professeur.types";

interface ProfesseurWithId extends Professeur {
  id: string;
}

export default function CoursAssignProf() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cours, setCours] = useState<Cours | null>(null);
  const [profs, setProfs] = useState<ProfesseurWithId[]>([]);
  const [profId, setProfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;

        const c = await getCoursById(id);
        const p = await getAllProfesseurs();

        setCours(c);
        setProfs(p as ProfesseurWithId[]);
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleAssign = async () => {
    try {
      if (!id || !profId) return;

      const prof = profs.find((p) => p.id === profId);
      if (!prof) return;

      await assignProfesseurToCours(
        id,
        prof.id,
        `${prof.prenom} ${prof.nom}`
      );

      navigate(`/admin/cours/${id}`);
    } catch {
      setError("Impossible d'assigner le professeur");
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!cours) return <div className="p-6">Cours introuvable</div>;

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Assigner un professeur</h1>

      <p>
        <b>Cours :</b> {cours.matiere} - {cours.classe}
      </p>

      <select
        value={profId}
        onChange={(e) => setProfId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">- Choisir un professeur -</option>
        {profs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.prenom} {p.nom} ({p.classes?.join(", ")})
          </option>
        ))}
      </select>

      <button
        onClick={handleAssign}
        disabled={!profId}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Assigner
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
