import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCoursById } from "./cours.service";
import type { Cours } from "./cours.types";
import PresenceAppel from "../presences/PresenceAppel";

export default function CoursDetail() {
  const { id } = useParams<{ id: string }>();
  const [cours, setCours] = useState<Cours | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAppel, setShowAppel] = useState(false);

  useEffect(() => {
    if (!id) return;

    getCoursById(id)
      .then((data) => {
        setCours(data);
        setLoading(false);
      })
      .catch(() => {
        setCours(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!cours) return <div className="p-6 text-red-600">Cours introuvable</div>;

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          📘 {cours.matiere}
        </h1>

        {/* ASSIGNER PROF (ADMIN) */}
        <Link
          to={`/admin/cours/${cours.id}/assign-prof`}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          👨‍🏫 Assigner un prof
        </Link>
      </div>

      {/* INFOS COURS */}
      <div className="space-y-2 text-sm">
        <p><b>Classe :</b> {cours.classe}</p>
        <p><b>Date :</b> {cours.date}</p>
        <p><b>Heure :</b> {cours.heureDebut} – {cours.heureFin}</p>
        <p><b>Type :</b> {cours.type}</p>
        <p><b>Statut :</b> {cours.statut}</p>

        {cours.professeurId && (
          <p><b>Professeur ID :</b> {cours.professeurId}</p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowAppel((v) => !v)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {showAppel ? "Fermer l'appel" : "📋 Faire l'appel"}
        </button>

        <Link
          to="/admin/cours"
          className="px-4 py-2 border rounded"
        >
          ⬅ Retour
        </Link>
      </div>

      {/* APPEL */}
      {showAppel && (
        <PresenceAppel
          coursId={cours.id!}
          classe={cours.classe}
          date={cours.date}
          heureDebut={cours.heureDebut}
          heureFin={cours.heureFin}
        />
      )}

    </div>
  );
}
