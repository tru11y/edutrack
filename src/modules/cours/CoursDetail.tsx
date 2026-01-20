import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCoursById } from "./cours.service";
import type { Cours } from "./cours.types";
import PresenceAppel from "../presences/PresenceAppel";

export default function CoursDetail() {
  const { id } = useParams();
  const [cours, setCours] = useState<Cours | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAppel, setShowAppel] = useState(false);

  useEffect(() => {
    if (!id) return;

    getCoursById(id).then((data) => {
      setCours(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!cours) return <div className="p-6 text-red-600">Cours introuvable</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{cours.matiere}</h1>

      <div className="space-y-2 mb-4">
        <p><b>Classe :</b> {cours.classe}</p>
        <p><b>Date :</b> {cours.date}</p>
        <p><b>Heure :</b> {cours.heureDebut} – {cours.heureFin}</p>
        <p><b>Type :</b> {cours.type}</p>
        <p><b>Statut :</b> {cours.statut}</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAppel((v) => !v)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {showAppel ? "Fermer l’appel" : "Faire l’appel"}
        </button>
      </div>

      {showAppel && (
        <PresenceAppel coursId={cours.id!} classe={cours.classe} />
      )}
    </div>
  );
}
