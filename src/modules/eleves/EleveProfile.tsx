import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEleveById } from "./eleve.service";
import type { Eleve } from "./eleve.types";

export default function EleveProfile() {
  const { id } = useParams<{ id: string }>();

  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    getEleveById(id)
      .then((data) => {
        setEleve(data);
      })
      .catch(() => {
        setError("Impossible de charger l’élève");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /* =====================
     STATES
  ===================== */

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!eleve) {
    return <div className="p-6 text-gray-500">Élève introuvable</div>;
  }

  const parents = eleve.parents ?? [];

  /* =====================
     UI
  ===================== */

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">
          {eleve.prenom} {eleve.nom}
        </h1>

        <Link
          to={`/admin/eleves/${eleve.id}/paiements`}
          className="px-3 py-1 rounded bg-gray-900 text-white text-sm"
        >
          💰 Paiements
        </Link>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <p><b>Classe :</b> {eleve.classe}</p>
        <p><b>Sexe :</b> {eleve.sexe}</p>
        <p><b>Statut :</b> {eleve.statut}</p>
      </div>

      {/* Parents */}
      <div>
       <h2 className="font-semibold mt-4">Parents</h2>

{Array.isArray(eleve.parents) && eleve.parents.length > 0 ? (
  <ul className="list-disc pl-6">
    {eleve.parents.map((p, i) => (
      <li key={i}>
        {p.nom} — {p.telephone} ({p.lien})
      </li>
    ))}
  </ul>
) : (
  <p className="text-gray-500">Aucun parent renseigné</p>
)}

      </div>
    </div>
  );
}
